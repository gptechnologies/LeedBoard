import { createHmac, timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueMail, processMailQueue } from "@/lib/mail-queue";
export async function POST(r: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response("Not configured", { status: 503 });
  const raw = await r.text();
  const id = r.headers.get("svix-id") ?? "";
  const ts = r.headers.get("svix-timestamp") ?? "";
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300)
    return new Response("Invalid timestamp", { status: 401 });
  const expected = createHmac(
    "sha256",
    Buffer.from(secret.replace(/^whsec_/, ""), "base64"),
  )
    .update(`${id}.${ts}.${raw}`)
    .digest();
  const valid = (r.headers.get("svix-signature") ?? "").split(" ").some((s) => {
    const signature = Buffer.from(s.replace(/^v1,/, ""), "base64");
    return (
      signature.length === expected.length &&
      timingSafeEqual(signature, expected)
    );
  });
  if (!valid) return new Response("Invalid signature", { status: 401 });
  const event = JSON.parse(raw);
  if (event.type === "email.received") {
    await prisma.$transaction(async (tx) => {
      await tx.inboundEmail.upsert({
        where: { id: event.data.email_id },
        update: {},
        create: { id: event.data.email_id, payload: event.data },
      });
      await queueMail(
        "inbound:" + event.data.email_id,
        "INBOUND",
        { id: event.data.email_id },
        tx,
      );
    });
  }
  if (
    ["email.delivered", "email.bounced", "email.failed"].includes(event.type)
  ) {
    await prisma.jobOutreach.updateMany({
      where: { providerMessageId: event.data.email_id },
      data: {
        status: event.type === "email.delivered" ? "DELIVERED" : "FAILED",
      },
    });
  }
  after(processMailQueue);
  return Response.json({ ok: true });
}
