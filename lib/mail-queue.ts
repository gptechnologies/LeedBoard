import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildAppUrl, sendTransactionalEmail } from "@/lib/email";
import { getProviderName } from "@/lib/providers";
export async function queueMail(
  key: string,
  kind: string,
  payload: Prisma.InputJsonObject,
  db: Pick<typeof prisma, "mailTask"> = prisma,
) {
  return db.mailTask.upsert({
    where: { key },
    update: {},
    create: { key, kind, payload },
  });
}
export async function queueLeadJob(
  jobId: string,
  db: Pick<typeof prisma, "mailTask"> = prisma,
) {
  return queueMail(`match:${jobId}`, "MATCH", { jobId }, db);
}
export async function processMailQueue() {
  const deadline = Date.now() + 20000;
  const now = new Date();
  await prisma.mailTask.updateMany({
    where: {
      status: "PROCESSING",
      lockedAt: { lt: new Date(Date.now() - 180000) },
    },
    data: { status: "PENDING" },
  });
  const tasks = await prisma.mailTask.findMany({
    where: { status: "PENDING", availableAt: { lte: now } },
    orderBy: { createdAt: "asc" },
    take: 40,
  });
  for (const task of tasks) {
    if (Date.now() >= deadline) break;
    const claim = await prisma.mailTask.updateMany({
      where: { id: task.id, status: "PENDING" },
      data: { status: "PROCESSING", lockedAt: now, attempts: { increment: 1 } },
    });
    if (!claim.count) continue;
    try {
      const p = task.payload as Record<string, string>;
      if (task.kind === "MATCH") {
        const job = await prisma.jobRequest.findUnique({
          where: { id: p.jobId },
        });
        if (
          job?.status === "OPEN" &&
          job.acceptanceDeadline &&
          job.acceptanceDeadline > now
        ) {
          const leads = await prisma.cleanerLead.findMany({
            where: {
              email: { not: null },
              emailConfirmedAt: { not: null },
              optedOutAt: null,
              pausedAt: null,
              OR: [
                { postalCode: job.postalCode },
                { serviceAreaPostalCodes: { has: job.postalCode } },
              ],
            },
          });
          const users = await prisma.user.findMany({
            where: {
              role: "CLEANER",
              emailVerifiedAt: { not: null },
              email: { not: null },
              cleanerProfile: {
                is: {
                  isAvailable: true,
                  serviceAreaPostalCodes: { has: job.postalCode },
                },
              },
            },
            include: { cleanerProfile: true },
          });
          const recipients = new Map<
            string,
            { leadId?: string; userId?: string }
          >();
          for (const u of users)
            if (u.email)
              recipients.set(u.email.toLowerCase(), { userId: u.id });
          for (const l of leads)
            if (l.email)
              recipients.set(l.email.toLowerCase(), {
                leadId: l.id,
                userId:
                  l.linkedCleanerUserId ??
                  recipients.get(l.email.toLowerCase())?.userId,
              });
          const suppressed = await prisma.cleanerLead.findMany({
            where: {
              OR: [{ optedOutAt: { not: null } }, { pausedAt: { not: null } }],
            },
            select: { email: true },
          });
          for (const lead of suppressed)
            if (lead.email) recipients.delete(lead.email.toLowerCase());
          for (const [email, identity] of recipients) {
            const key = `lead:${job.id}:${email}`;
            await prisma.$transaction(async (tx) => {
              const existing = await tx.mailTask.findUnique({ where: { key } });
              if (existing) return;
              const outreach = await tx.jobOutreach.create({
                data: {
                  jobRequestId: job.id,
                  cleanerLeadId: identity.leadId,
                  cleanerUserId: identity.userId,
                  channel: "EMAIL",
                  interestToken: randomBytes(32).toString("base64url"),
                  interestTokenExpiresAt: job.acceptanceDeadline!,
                },
              });
              await queueMail(
                key,
                "LEAD",
                { outreachId: outreach.id, email },
                tx,
              );
            });
          }
        }
      } else if (task.kind === "LEAD") {
        const o = await prisma.jobOutreach.findUnique({
          where: { id: p.outreachId },
          include: {
            jobRequest: true,
            cleanerLead: true,
            cleanerUser: { include: { cleanerProfile: true } },
          },
        });
        if (
          o &&
          !["SENT", "DELIVERED", "BID_SUBMITTED", "NOT_INTERESTED"].includes(
            o.status,
          ) &&
          o.jobRequest.status === "OPEN" &&
          o.jobRequest.acceptanceDeadline! > new Date() &&
          !o.cleanerLead?.optedOutAt &&
          !o.cleanerLead?.pausedAt &&
          (o.cleanerLeadId
            ? !!o.cleanerLead?.emailConfirmedAt
            : !!o.cleanerUser?.cleanerProfile?.isAvailable)
        ) {
          const j = o.jobRequest;
          const url = buildAppUrl(`/invite/cleaner/${o.interestToken}`);
          const timing = j.requestedDate
            ? `${j.requestedDate.toISOString().slice(0, 10)} · ${j.requestedWindowStart}–${j.requestedWindowEnd} (${j.timezone})`
            : "First available";
          const result = await sendTransactionalEmail({
            to: p.email,
            subject: `Cleaning lead ${j.publicReference} · ${j.postalCode}`,
            replyTo: process.env.INBOUND_EMAIL_DOMAIN
              ? `bid+${o.interestToken}@${process.env.INBOUND_EMAIL_DOMAIN}`
              : undefined,
            idempotencyKey: task.key,
            text: `A homeowner needs a cleaner.\n\n${j.publicReference}\nZIP ${j.postalCode}\n${j.bedroomCount ?? "Not supplied"} bedrooms · ${j.bathroomCount ?? "See summary"} bathrooms\n${j.cleanType?.replaceAll("_", " ").toLowerCase() ?? "Standard clean"} · cleaner brings supplies\n${timing}\n\nSend total price and availability:\n${url}\n\n${process.env.INBOUND_EMAIL_DOMAIN ? "Or reply with your total and availability, e.g. $150, Friday at 9am. Use New York time." : "Use the small form above to send your total price and availability."}\n\nNo account needed. Address and contact details are shared only with the selected cleaner.\nManage leads: ${o.cleanerLead?.subscriptionToken ? buildAppUrl("/leads/manage/" + o.cleanerLead.subscriptionToken) : buildAppUrl("/cleaner/account")}`,
          });
          await prisma.$transaction(async (tx) => {
            await tx.jobOutreach.update({
              where: { id: o.id },
              data: {
                status: "SENT",
                providerMessageId: result.providerMessageId,
              },
            });
            await tx.jobRequest.update({
              where: { id: j.id },
              data: { cleanersNotifiedCount: { increment: 1 } },
            });
          });
        }
      } else if (task.kind === "INTRO") {
        const intro = await prisma.introduction.findUnique({
          where: { jobId: p.jobId },
        });
        const j = await prisma.jobRequest.findUnique({
          where: { id: p.jobId },
          include: {
            customer: true,
            acceptedBid: { include: { cleaner: true, cleanerLead: true } },
          },
        });
        if (intro && j?.status === "AWARDED" && j.acceptedBid) {
          const b = j.acceptedBid;
          const email = b.cleanerLead?.email ?? b.cleaner?.email;
          if (email)
            await sendTransactionalEmail({
              to: email,
              idempotencyKey: task.key + ":cleaner",
              subject: `You’re selected · ${j.publicReference}`,
              text: `The homeowner accepted your $${(b.flatRateCents! / 100).toFixed(2)} bid.\nArrival: ${b.arrivalDate?.toISOString().slice(0, 10)} ${b.arrivalWindowStart}\n\nView your private introduction: ${buildAppUrl("/introduction/" + intro.token)}\nPayment is arranged directly.`,
            });
          if (j.customer.email)
            await sendTransactionalEmail({
              to: j.customer.email,
              idempotencyKey: task.key + ":owner",
              subject: `You’re connected · ${j.publicReference}`,
              text: `You selected ${getProviderName(b)}.\n${email ?? ""} ${b.cleanerLead?.phone ?? b.cleaner?.phone ?? ""}\n\nReview the job: ${buildAppUrl("/customer#job-" + j.id)}\nPayment is arranged directly.`,
            });
        }
      } else if (task.kind === "INBOUND") {
        const { processInbound } = await import("@/lib/inbound-email");
        await processInbound(p.id);
      } else if (task.kind === "EMAIL") {
        await sendTransactionalEmail({
          to: p.to,
          subject: p.subject,
          text: p.text,
          replyTo: p.replyTo || undefined,
          idempotencyKey: task.key,
        });
      }
      await prisma.mailTask.update({
        where: { id: task.id },
        data: { status: "SENT", error: null },
      });
    } catch (error) {
      if (task.kind === "LEAD") {
        const p = task.payload as { outreachId: string };
        await prisma.jobOutreach.updateMany({
          where: {
            id: p.outreachId,
            status: { notIn: ["BID_SUBMITTED", "NOT_INTERESTED"] },
          },
          data: { status: "FAILED" },
        });
      }
      await prisma.mailTask.update({
        where: { id: task.id },
        data: {
          status: task.attempts >= 4 ? "FAILED" : "PENDING",
          availableAt: new Date(
            Date.now() + Math.min(3600, 30 * 2 ** task.attempts) * 1000,
          ),
          error: error instanceof Error ? error.message : "Delivery failed",
        },
      });
    }
  }
}
