import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
export async function POST(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await requireApiUser(r, "CLEANER");
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const j = await prisma.jobRequest.findUnique({ where: { id } });
  if (
    !j ||
    j.status !== "OPEN" ||
    !j.acceptanceDeadline ||
    j.acceptanceDeadline <= new Date()
  )
    return NextResponse.redirect(new URL("/cleaner", r.url), 303);
  let o = await prisma.jobOutreach.findFirst({
    where: { jobRequestId: id, cleanerUserId: u.id },
    orderBy: { createdAt: "desc" },
  });
  const lead = u.email
    ? await prisma.cleanerLead.findFirst({
        where: {
          OR: [
            { normalizedEmail: u.email.toLowerCase() },
            { email: { equals: u.email, mode: "insensitive" } },
          ],
        },
      })
    : null;
  if (!o)
    o = await prisma.jobOutreach.create({
      data: {
        jobRequestId: id,
        cleanerUserId: u.id,
        cleanerLeadId: lead?.id,
        channel: "APP",
        interestToken: randomBytes(32).toString("base64url"),
        interestTokenExpiresAt: j.acceptanceDeadline,
      },
    });
  return NextResponse.redirect(
    new URL(`/invite/cleaner/${o.interestToken}?edit=1`, r.url),
    303,
  );
}
