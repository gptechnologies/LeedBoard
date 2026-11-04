import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { parseQuickPost } from "@/lib/quick-post";
import { queueMail, processMailQueue } from "@/lib/mail-queue";
import { buildAppUrl } from "@/lib/email";
export async function POST(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await requireApiUser(r, "CUSTOMER");
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  try {
    const f = await r.formData();
    const input = parseQuickPost(f);
    const {
      postingKey: _,
      addressLine1: __,
      city: ___,
      state: ____,
      ...data
    } = input;
    const revision = Number(f.get("revision"));
    await prisma.$transaction(async (tx) => {
      const j = await tx.jobRequest.findFirst({
        where: {
          id,
          customerId: u.id,
          status: "OPEN",
          revision,
          acceptanceDeadline: { gt: new Date() },
        },
        include: {
          outreaches: { include: { cleanerLead: true, cleanerUser: true } },
        },
      });
      if (!j)
        throw new Error(
          "This request has changed or closed. Refresh and try again.",
        );
      const fields = [
        "postalCode",
        "bedroomCount",
        "bathroomCount",
        "cleanType",
        "timingPreference",
        "requestedWindowStart",
        "requestedWindowEnd",
        "notes",
      ] as const;
      const changed =
        fields.some((k) => j[k] !== data[k]) ||
        j.requestedDate?.getTime() !== data.requestedDate?.getTime();
      if (!changed) return;
      const claim = await tx.jobRequest.updateMany({
        where: {
          id,
          customerId: u.id,
          status: "OPEN",
          revision,
          acceptanceDeadline: { gt: new Date() },
        },
        data: {
          ...data,
          revision: { increment: 1 },
          ...(j.postalCode !== data.postalCode
            ? {
                homeProfileId: null,
                addressLine1: "",
                addressLine2: null,
                city: "",
                state: "",
                entryNotes: null,
                homeFactsSnapshot: {},
              }
            : {}),
        },
      });
      if (!claim.count)
        throw new Error("This request changed. Refresh before saving.");
      await tx.jobBid.updateMany({
        where: { jobRequestId: id, status: "SUBMITTED" },
        data: { status: "WITHDRAWN", customerViewedAt: null },
      });
      await queueMail(
        `match:${id}:revision:${revision + 1}`,
        "MATCH",
        { jobId: id },
        tx,
      );
      for (const o of j.outreaches) {
        const email = o.cleanerLead?.email ?? o.cleanerUser?.email;
        if (email && !o.cleanerLead?.optedOutAt && !o.cleanerLead?.pausedAt)
          await queueMail(
            `job-update:${id}:${revision + 1}:${email.toLowerCase()}`,
            "EMAIL",
            {
              to: email,
              subject: `Cleaning request updated · ${j.publicReference}`,
              text: `The homeowner updated this request. Previous bids need to be confirmed again.\n${data.bedroomCount} beds · ${data.bathroomCount} baths · ZIP ${data.postalCode}\n${data.requestedDate?.toISOString().slice(0, 10) ?? "First available"} ${data.requestedWindowStart ?? ""}\nReview the current request and send a new total and arrival: ${buildAppUrl("/invite/cleaner/" + o.interestToken + "?edit=1")}`,
            },
            tx,
          );
      }
    });
    after(processMailQueue);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to update request" },
      { status: 400 },
    );
  }
}
