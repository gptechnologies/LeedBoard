import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { privateText } from "@/lib/lead-policy";
import { queueMail, processMailQueue } from "@/lib/mail-queue";
import { buildAppUrl } from "@/lib/email";
export async function POST(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await requireApiUser(r, "ADMIN");
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const f = await r.formData();
  const task = await prisma.mailTask.findUnique({ where: { id } });
  if (!task) return new Response("Not found", { status: 404 });
  try {
    if (task.status === "FAILED") {
      await prisma.mailTask.update({
        where: { id },
        data: { status: "PENDING", attempts: 0, availableAt: new Date() },
      });
    } else if (task.status === "REVIEW") {
      const p = task.payload as { messageId: string; bidId: string };
      const body = String(f.get("body") ?? "").trim();
      if (!body || body.length > 2000 || privateText(body))
        throw new Error("Remove personal details before approving.");
      const b = await prisma.jobBid.findUnique({
        where: { id: p.bidId },
        include: {
          cleaner: true,
          cleanerLead: true,
          outreach: true,
          jobRequest: true,
        },
      });
      if (!b || !["OPEN", "AWARDED"].includes(b.jobRequest.status))
        throw new Error("This conversation has closed.");
      await prisma.$transaction(async (tx) => {
        await tx.conversationMessage.update({
          where: { id: p.messageId },
          data: { body, deliveryStatus: "SENT" },
        });
        const email = b.cleanerLead?.email ?? b.cleaner?.email;
        if (email)
          await queueMail(
            `approved:${p.messageId}`,
            "EMAIL",
            {
              to: email,
              subject: "Homeowner reply",
              text: `${body}\n\n${buildAppUrl(b.outreach ? "/invite/cleaner/" + b.outreach.interestToken : "/cleaner/messages/" + b.id)}`,
              replyTo:
                b.outreach && process.env.INBOUND_EMAIL_DOMAIN
                  ? `bid+${b.outreach.interestToken}@${process.env.INBOUND_EMAIL_DOMAIN}`
                  : "",
            },
            tx,
          );
        await tx.mailTask.update({ where: { id }, data: { status: "SENT" } });
      });
    }
    after(processMailQueue);
    return NextResponse.redirect(new URL("/admin/outreach", r.url), 303);
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unable to update", {
      status: 400,
    });
  }
}
