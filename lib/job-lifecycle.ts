import { JobRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAcceptanceDeadline } from "@/lib/job-deadline";

export async function expireDueJobs() {
  const now = new Date();
  const missingDeadlines = await prisma.jobRequest.findMany({
    where: { status: JobRequestStatus.OPEN, acceptanceDeadline: null },
    select: { id: true, acceptanceDeadline: true, createdAt: true, requestedDate: true, requestedWindowStart: true },
  });
  await Promise.all(missingDeadlines.map((job) => prisma.jobRequest.updateMany({
    where: { id: job.id, status: JobRequestStatus.OPEN, acceptanceDeadline: null },
    data: { acceptanceDeadline: getAcceptanceDeadline(job) },
  })));
  const due = await prisma.jobRequest.findMany({
    where: { status: JobRequestStatus.OPEN, acceptedBidId: null, acceptanceDeadline: { lte: now } },
    select: { id: true },
  });
  for (const job of due) {
    const result = await prisma.jobRequest.updateMany({
      where: { id: job.id, status: JobRequestStatus.OPEN, acceptedBidId: null, acceptanceDeadline: { lte: now } },
      data: { status: JobRequestStatus.EXPIRED },
    });
    if (result.count) {
      await prisma.jobBid.updateMany({ where: { jobRequestId: job.id }, data: { cleanerViewedAt: null, customerViewedAt: null } });
      const { notifyCleanersOfJobClosure, notifyHomeownerOfJobExpiration } = await import("@/lib/marketplace-notifications");
      await Promise.all([notifyCleanersOfJobClosure(job.id, "expired"), notifyHomeownerOfJobExpiration(job.id)]);
    }
  }
}

export async function expireJobIfDue(jobId: string) {
  const job = await prisma.jobRequest.findUnique({
    where: { id: jobId },
    select: { id: true, status: true, acceptedBidId: true, acceptanceDeadline: true, createdAt: true, requestedDate: true, requestedWindowStart: true },
  });
  if (!job || job.status !== JobRequestStatus.OPEN || job.acceptedBidId) return job;
  const deadline = getAcceptanceDeadline(job);
  if (!job.acceptanceDeadline) await prisma.jobRequest.updateMany({ where: { id: jobId, status: JobRequestStatus.OPEN, acceptanceDeadline: null }, data: { acceptanceDeadline: deadline } });
  if (new Date() < deadline) return job;
  const changed = await prisma.jobRequest.updateMany({ where: { id: jobId, status: JobRequestStatus.OPEN, acceptedBidId: null }, data: { status: JobRequestStatus.EXPIRED } });
  if (changed.count) {
    await prisma.jobBid.updateMany({ where: { jobRequestId: jobId }, data: { cleanerViewedAt: null, customerViewedAt: null } });
    const { notifyCleanersOfJobClosure, notifyHomeownerOfJobExpiration } = await import("@/lib/marketplace-notifications");
    await Promise.all([notifyCleanersOfJobClosure(jobId, "expired"), notifyHomeownerOfJobExpiration(jobId)]);
  }
  return { ...job, status: changed.count ? JobRequestStatus.EXPIRED : job.status, acceptanceDeadline: deadline };
}
