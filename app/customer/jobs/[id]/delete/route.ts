import { JobRequestStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { notifyCleanersOfJobClosure } from "@/lib/marketplace-notifications";
import { getPostingDeletion } from "@/lib/job-activity";

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
  const job = await prisma.jobRequest.findFirst({
    where: { id, customerId: user.id },
    select: { id: true, status: true, acceptedBidId: true, revision: true, deletedAt: true },
  });

  if (!job) {
    return redirectWithError(request, id, "That job could not be found.");
  }

  // Repeated requests are harmless and must not send duplicate closure notices.
  if (job.deletedAt || job.status === JobRequestStatus.DELETED) {
    if (request.headers.get("X-Well-Kept-Client") === "1") return NextResponse.json({ ok: true });
    return NextResponse.redirect(new URL("/customer/jobs?deleted=1", request.url), 303);
  }

  const confirmation = await request.json().catch(() => null);
  if (confirmation && (confirmation.revision !== job.revision || confirmation.status !== job.status)) {
    return redirectWithError(request, id, "This job changed. Refresh and review it before deleting.");
  }
  const deletion = getPostingDeletion(job);
  const deleted = await prisma.$transaction(async (tx) => {
    const result = await tx.jobRequest.updateMany({
      where: {
        id: job.id, customerId: user.id, deletedAt: null,
        status: job.status, acceptedBidId: job.acceptedBidId, revision: job.revision,
      },
      data: {
        deletedAt: new Date(),
        status: deletion.active ? JobRequestStatus.CANCELLED : job.status,
        revision: { increment: 1 },
      },
    });
    if (result.count !== 1) return false;
    if (deletion.active) {
      await tx.jobBid.updateMany({ where: { jobRequestId: id }, data: { cleanerViewedAt: null, customerViewedAt: new Date() } });
    }
    return true;
  });
  if (!deleted) return redirectWithError(request, id, "This job changed. Refresh and review it before deleting.");
  if (deletion.active) await notifyCleanersOfJobClosure(id, "cancelled");

  if (request.headers.get("X-Well-Kept-Client") === "1") return NextResponse.json({ ok: true });
  return NextResponse.redirect(new URL("/customer/jobs?deleted=1", request.url), 303);
}
