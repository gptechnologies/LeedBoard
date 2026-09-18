import { JobRequestStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { notifyCleanersOfJobClosure } from "@/lib/marketplace-notifications";

function redirectWithError(request: Request, jobId: string, message: string) {
  if (request.headers.get("X-Well-Kept-Client") === "1") return NextResponse.json({ error: message }, { status: 400 });
  return NextResponse.redirect(
    new URL(`/customer/jobs/${jobId}?error=${encodeURIComponent(message)}`, request.url),
  );
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await context.params;
  const job = await prisma.jobRequest.findFirst({ where: { id, customerId: user.id }, select: { id: true, status: true, acceptedBidId: true } });

  if (!job) {
    return redirectWithError(request, id, "That job could not be found.");
  }

  if (job.acceptedBidId || (job.status !== JobRequestStatus.OPEN && job.status !== JobRequestStatus.EXPIRED)) {
    return redirectWithError(request, id, "Only an unaccepted posting can be deleted.");
  }

  const result = await prisma.jobRequest.updateMany({
    where: { id: job.id, customerId: user.id, acceptedBidId: null, status: { in: [JobRequestStatus.OPEN, JobRequestStatus.EXPIRED] } },
    data: { status: JobRequestStatus.DELETED, deletedAt: new Date() },
  });
  if (result.count !== 1) return redirectWithError(request, id, "This job changed. Refresh and try again.");
  await prisma.jobBid.updateMany({ where: { jobRequestId: id }, data: { cleanerViewedAt: null, customerViewedAt: new Date() } });
  await notifyCleanersOfJobClosure(id, "deleted");

  if (request.headers.get("X-Well-Kept-Client") === "1") return NextResponse.json({ ok: true });
  return NextResponse.redirect(new URL("/customer/jobs?deleted=1", request.url), 303);
}
