import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/session";
import { parseZip } from "@/lib/lead-policy";
import { queueMail } from "@/lib/mail-queue";
import { buildAppUrl } from "@/lib/email";
export async function enrollLead(f: FormData) {
  const email = normalizeEmail(String(f.get("email") ?? ""));
  const business = String(
    f.get("business") ?? f.get("businessName") ?? f.get("website") ?? "",
  ).trim();
  if (!business || business.length > 160)
    throw new Error("Enter your business name or website.");
  const postalCode = parseZip(f.get("postalCode"));
  const zips = Array.from(
    new Set([
      postalCode,
      ...String(f.get("extraZips") ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map(parseZip),
    ]),
  );
  const existing = await prisma.cleanerLead.findFirst({
    where: {
      OR: [
        { normalizedEmail: email },
        { email: { equals: email, mode: "insensitive" } },
      ],
    },
  });
  // Existing subscriptions are only editable through their private preferences link.
  const lead =
    existing ??
    (await prisma.cleanerLead.create({
      data: {
        email,
        source: "WEBSITE",
        normalizedEmail: email,
        businessName: business,
        website: /^(https?:\/\/|www\.)/i.test(business) ? business : null,
        postalCode,
        serviceAreaPostalCodes: zips,
        subscriptionToken: randomBytes(32).toString("base64url"),
      },
    }));
  const token = lead.subscriptionToken ?? randomBytes(32).toString("base64url");
  if (!lead.subscriptionToken)
    await prisma.cleanerLead.update({
      where: { id: lead.id },
      data: { subscriptionToken: token },
    });
  await queueMail(
    `subscribe:${lead.id}:${Math.floor(Date.now() / 600000)}`,
    "EMAIL",
    {
      to: email,
      subject: "Confirm your Well Kept leads",
      text: `Confirm your email and choose whether to receive cleaning leads:\n${buildAppUrl("/leads/manage/" + token)}\n\nIf you did not request this, ignore this email.`,
    },
  );
}
