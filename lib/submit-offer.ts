import { prisma } from "@/lib/prisma";
import { arrivalInstant, privateText } from "@/lib/lead-policy";
import { queueMail } from "@/lib/mail-queue";
import { buildAppUrl } from "@/lib/email";
export async function submitOffer(token: string, f: FormData) {
  const o = await prisma.jobOutreach.findUnique({
    where: { interestToken: token },
    include: {
      jobRequest: { include: { customer: true } },
      cleanerLead: true,
      cleanerUser: true,
    },
  });
  if (!o || o.interestTokenExpiresAt <= new Date())
    throw new Error("This link has expired.");
  const j = o.jobRequest;
  if (
    j.status !== "OPEN" ||
    !j.acceptanceDeadline ||
    j.acceptanceDeadline <= new Date()
  )
    throw new Error("This job is no longer accepting bids.");
  if (!o.cleanerLeadId && !o.cleanerUserId)
    throw new Error("Provider not found.");
  const recent = await prisma.outreachEvent.count({
    where: {
      jobOutreachId: o.id,
      eventType: "BID_SUBMITTED",
      createdAt: { gte: new Date(Date.now() - 60000) },
    },
  });
  if (recent >= 10)
    throw new Error("Please wait a minute before sending another update.");
  if (f.has("jobRevision") && Number(f.get("jobRevision")) !== j.revision)
    throw new Error(
      "This cleaning request changed. Reload the details before submitting your bid.",
    );
  const date = String(f.get("availableDate") ?? "");
  const start = String(f.get("arrivalTime") ?? "");
  const question = String(f.get("question") ?? "").trim();
  const price = Number(f.get("price"));
  if (!question && (!Number.isFinite(price) || price <= 0 || price > 10000))
    throw new Error("Enter a total price between $0.01 and $10,000.");
  if (question.length > 500)
    throw new Error("Keep questions under 500 characters.");
  const arrival = question ? null : arrivalInstant(date, start, j.timezone);
  if (arrival && arrival <= new Date())
    throw new Error("Choose a future arrival.");
  const note = String(f.get("message") ?? "").trim();
  if (note.length > 350)
    throw new Error("Keep your note under 350 characters.");
  if (privateText(note) || privateText(question))
    throw new Error(
      "Keep contact details and addresses private until the homeowner selects you.",
    );
  return prisma.$transaction(async (tx) => {
    const claim = await tx.jobRequest.updateMany({
      where: {
        id: j.id,
        revision: j.revision,
        status: "OPEN",
        acceptanceDeadline: { gt: new Date() },
      },
      data: { updatedAt: new Date() },
    });
    if (!claim.count) throw new Error("This job has closed.");
    const existing = await tx.jobBid.findFirst({
      where: {
        jobRequestId: j.id,
        OR: [
          ...(o.cleanerLeadId ? [{ cleanerLeadId: o.cleanerLeadId }] : []),
          ...(o.cleanerUserId ? [{ cleanerId: o.cleanerUserId }] : []),
        ],
      },
    });
    if (existing?.status === "ACCEPTED")
      throw new Error("This offer is already accepted.");
    if (f.get("action") === "withdraw") {
      if (existing)
        await tx.jobBid.update({
          where: { id: existing.id },
          data: { status: "WITHDRAWN" },
        });
      return existing;
    }
    const matches =
      !question &&
      j.requestedDate?.toISOString().slice(0, 10) === date &&
      start >= (j.requestedWindowStart ?? "00:00") &&
      start <= (j.requestedWindowEnd ?? "23:59");
    const data = {
      pricingType: "FLAT" as const,
      offerType: question
        ? ("NEEDS_DETAILS" as const)
        : ("FIXED_PRICE" as const),
      source: "PROVIDER_FORM" as const,
      flatRateCents: question ? null : Math.round(price * 100),
      arrivalDate: question ? null : new Date(date + "T12:00:00Z"),
      arrivalWindowStart: question ? null : start,
      arrivalWindowEnd: null,
      requestedScheduleAccepted: matches,
      providerQuestion: question || null,
      message: note || null,
      status: "SUBMITTED" as const,
      submittedAt: new Date(),
      customerViewedAt: null,
    };
    const bid = existing
      ? await tx.jobBid.update({ where: { id: existing.id }, data })
      : await tx.jobBid.create({
          data: {
            ...data,
            jobRequestId: j.id,
            cleanerLeadId: o.cleanerLeadId,
            cleanerId: o.cleanerUserId,
          },
        });
    await tx.jobOutreach.updateMany({
      where: { bidId: bid.id, id: { not: o.id } },
      data: { bidId: null },
    });
    await tx.jobOutreach.update({
      where: { id: o.id },
      data: { bidId: bid.id, status: "BID_SUBMITTED" },
    });
    if (j.customer.email)
      await queueMail(
        `bid:${bid.id}:${bid.updatedAt.getTime()}`,
        "EMAIL",
        {
          to: j.customer.email,
          subject: question
            ? "A cleaner has a question"
            : `New cleaning bid · ${j.publicReference}`,
          text: question
            ? `${question}\n\nAnswer in your job workspace: ${buildAppUrl("/customer/messages/" + bid.id)}`
            : `$${price.toFixed(2)} · ${date} at ${start}\nReview all bids: ${buildAppUrl("/customer/messages/" + bid.id)}`,
        },
        tx,
      );
    await tx.outreachEvent.create({
      data: {
        jobOutreachId: o.id,
        eventType: "BID_SUBMITTED",
        payload: { bidId: bid.id },
      },
    });
    return bid;
  });
}
