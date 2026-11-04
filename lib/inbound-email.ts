import { prisma } from "@/lib/prisma";
import { parseEmailBid, privateText } from "@/lib/lead-policy";
import { submitOffer } from "@/lib/submit-offer";
import { queueMail } from "@/lib/mail-queue";
import { buildAppUrl } from "@/lib/email";
export async function processInbound(id: string) {
  const record = await prisma.inboundEmail.findUnique({ where: { id } });
  if (!record || record.status === "DONE") return;
  const r = await fetch(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } },
  );
  if (!r.ok) throw new Error("Unable to retrieve inbound email");
  const mail = (await r.json()) as {
    from: string;
    to: string[];
    text?: string;
    headers?: Record<string, string>;
  };
  if (
    /auto-(submitted|replied)|mailer-daemon|postmaster/i.test(
      JSON.stringify(mail.headers ?? {}) + " " + mail.from,
    )
  ) {
    await prisma.inboundEmail.update({
      where: { id },
      data: { status: "DONE" },
    });
    return;
  }
  const token = mail.to
    .map((x) => /bid\+([A-Za-z0-9_-]+)@/.exec(x)?.[1])
    .find(Boolean);
  const o = token
    ? await prisma.jobOutreach.findUnique({
        where: { interestToken: token },
        include: { cleanerLead: true, cleanerUser: true, jobRequest: true },
      })
    : null;
  const email = mail.from.match(/<([^>]+)>/)?.[1] ?? mail.from;
  const expected = o?.cleanerLead?.email ?? o?.cleanerUser?.email;
  if (
    !o ||
    !expected ||
    email.trim().toLowerCase() !== expected.toLowerCase()
  ) {
    await prisma.inboundEmail.update({
      where: { id },
      data: { status: "REVIEW", error: "Unknown recipient or sender" },
    });
    return;
  }
  if (o.jobRequest.status !== "OPEN") {
    await prisma.inboundEmail.update({
      where: { id },
      data: { status: "DONE" },
    });
    return;
  }
  const body = (mail.text ?? "").split(/\n(?:On .*wrote:|>)/)[0].trim();
  const bid = parseEmailBid(body, record.createdAt);
  if (bid) {
    const f = new FormData();
    Object.entries(bid).forEach(([k, v]) => f.set(k, v));
    await submitOffer(token!, f);
    await queueMail("receipt:" + id, "EMAIL", {
      to: expected,
      subject: `Bid received · ${o.jobRequest.publicReference}`,
      text: `Your total: $${bid.price}\nArrival: ${bid.availableDate} ${bid.arrivalTime} (New York time)\n\nEdit or withdraw: ${buildAppUrl("/invite/cleaner/" + token)}`,
    });
    await prisma.inboundEmail.update({
      where: { id },
      data: { status: "DONE" },
    });
  } else if (body.endsWith("?") && !/\$|\d/.test(body) && !privateText(body)) {
    const f = new FormData();
    f.set("question", body);
    await submitOffer(token!, f);
    await prisma.inboundEmail.update({
      where: { id },
      data: { status: "DONE" },
    });
  } else {
    await queueMail("clarify:" + id, "EMAIL", {
      to: expected,
      subject: "Confirm your price and availability",
      text: `We haven’t submitted a bid from your reply yet.\nReply with a total and date/time in this format: $150, 2026-11-06 09:00\nOr use this small form: ${buildAppUrl("/invite/cleaner/" + token + "?edit=1")}\nYour price is the total for the clean, and the time is your arrival in New York time.`,
      replyTo: `bid+${token}@${process.env.INBOUND_EMAIL_DOMAIN}`,
    });
    await prisma.inboundEmail.update({
      where: { id },
      data: { status: "REVIEW", error: "Needs clarification" },
    });
  }
}
