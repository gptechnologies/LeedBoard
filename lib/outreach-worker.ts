import {
  BidStatus,
  ConversationCloseReason,
  JobRequestStatus,
  OutreachState,
} from "@prisma/client";

import { createJobOutreachForJob } from "@/lib/outreach";
import { prisma } from "@/lib/prisma";

const MAX_OUTREACH_ATTEMPTS = 3;
const ASAP_ATTENTION_MINUTES = 15;
const SCHEDULED_ATTENTION_MINUTES = 120;
const OUTREACH_LEASE_MINUTES = 5;

function nextRetryDate(attempt: number) {
  const delayMinutes = [1, 5, 15][Math.max(0, Math.min(attempt - 1, 2))];
  return new Date(Date.now() + delayMinutes * 60_000);
}

export async function processJobOutreach(jobRequestId: string) {
  const now = new Date();
  const staleLease = new Date(now.getTime() - OUTREACH_LEASE_MINUTES * 60_000);
  const claimed = await prisma.jobRequest.updateMany({
    where: {
      id: jobRequestId,
      status: JobRequestStatus.OPEN,
      OR: [
        { outreachState: OutreachState.PENDING },
        {
          outreachState: OutreachState.FAILED,
          OR: [{ outreachNextAttemptAt: null }, { outreachNextAttemptAt: { lte: now } }],
        },
        {
          outreachState: OutreachState.CONTACTED,
          outreachNextAttemptAt: { lte: now },
        },
        {
          outreachState: OutreachState.IN_PROGRESS,
          outreachStartedAt: { lte: staleLease },
        },
      ],
    },
    data: {
      outreachAttemptCount: { increment: 1 },
      outreachFailureReason: null,
      outreachNextAttemptAt: null,
      outreachStartedAt: now,
      outreachState: OutreachState.IN_PROGRESS,
    },
  });

  if (claimed.count !== 1) return null;

  const job = await prisma.jobRequest.findUnique({
    where: { id: jobRequestId },
    select: {
      city: true,
      id: true,
      outreachAttemptCount: true,
      postalCode: true,
      serviceNeeds: true,
      state: true,
    },
  });
  if (!job) return null;

  try {
    const result = await createJobOutreachForJob({
      city: job.city,
      jobRequestId: job.id,
      postalCode: job.postalCode,
      serviceNeeds: job.serviceNeeds,
      state: job.state,
    });

    if (result.eligibleCount === 0 || result.targetedCount === 0) {
      return prisma.jobRequest.update({
        where: { id: job.id },
        data: {
          attentionReason: "No approved provider currently matches this request.",
          cleanersNotifiedCount: 0,
          needsAttentionAt: new Date(),
          outreachCompletedAt: new Date(),
          outreachNextAttemptAt: null,
          outreachState: OutreachState.NEEDS_ATTENTION,
        },
      });
    }

    if (result.sentCount === 0) {
      const exhausted = job.outreachAttemptCount >= MAX_OUTREACH_ATTEMPTS;
      return prisma.jobRequest.update({
        where: { id: job.id },
        data: {
          attentionReason: exhausted ? "Provider invitations could not be delivered." : null,
          cleanersNotifiedCount: 0,
          needsAttentionAt: exhausted ? new Date() : null,
          outreachFailureReason: "No provider invitation was delivered.",
          outreachNextAttemptAt: exhausted ? null : nextRetryDate(job.outreachAttemptCount),
          outreachState: exhausted ? OutreachState.NEEDS_ATTENTION : OutreachState.FAILED,
        },
      });
    }

    const shouldRetryFailures =
      result.failedCount > 0 && job.outreachAttemptCount < MAX_OUTREACH_ATTEMPTS;
    return prisma.jobRequest.update({
      where: { id: job.id },
      data: {
        attentionReason: null,
        cleanersNotifiedCount: result.sentCount,
        needsAttentionAt: null,
        outreachCompletedAt: new Date(),
        outreachFailureReason: result.failedCount > 0
          ? `${result.failedCount} provider invitation${result.failedCount === 1 ? "" : "s"} failed.`
          : null,
        outreachNextAttemptAt: shouldRetryFailures
          ? nextRetryDate(job.outreachAttemptCount)
          : null,
        outreachState: OutreachState.CONTACTED,
      },
    });
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "Outreach processing failed.";
    const exhausted = job.outreachAttemptCount >= MAX_OUTREACH_ATTEMPTS;
    return prisma.jobRequest.update({
      where: { id: job.id },
      data: {
        attentionReason: exhausted ? failureReason : null,
        needsAttentionAt: exhausted ? new Date() : null,
        outreachFailureReason: failureReason,
        outreachNextAttemptAt: exhausted ? null : nextRetryDate(job.outreachAttemptCount),
        outreachState: exhausted ? OutreachState.NEEDS_ATTENTION : OutreachState.FAILED,
      },
    });
  }
}

export async function processPendingOutreachJobs(limit = 10) {
  const now = new Date();
  const staleLease = new Date(now.getTime() - OUTREACH_LEASE_MINUTES * 60_000);
  const jobs = await prisma.jobRequest.findMany({
    where: {
      status: JobRequestStatus.OPEN,
      OR: [
        { outreachState: OutreachState.PENDING },
        {
          outreachState: OutreachState.FAILED,
          OR: [{ outreachNextAttemptAt: null }, { outreachNextAttemptAt: { lte: now } }],
        },
        {
          outreachState: OutreachState.CONTACTED,
          outreachNextAttemptAt: { lte: now },
        },
        {
          outreachState: OutreachState.IN_PROGRESS,
          outreachStartedAt: { lte: staleLease },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
    take: limit,
  });

  const results = [];
  for (const job of jobs) results.push(await processJobOutreach(job.id));
  return results;
}

export async function markUnansweredJobsForAttention() {
  const now = Date.now();
  const [asap, scheduled] = await Promise.all([
    prisma.jobRequest.updateMany({
      where: {
        bids: { none: { status: BidStatus.SUBMITTED } },
        createdAt: { lte: new Date(now - ASAP_ATTENTION_MINUTES * 60_000) },
        outreachState: OutreachState.CONTACTED,
        status: JobRequestStatus.OPEN,
        timingPreference: "ASAP",
      },
      data: {
        attentionReason: "No bid has arrived for this ASAP request.",
        needsAttentionAt: new Date(),
        outreachState: OutreachState.NEEDS_ATTENTION,
      },
    }),
    prisma.jobRequest.updateMany({
      where: {
        bids: { none: { status: BidStatus.SUBMITTED } },
        createdAt: { lte: new Date(now - SCHEDULED_ATTENTION_MINUTES * 60_000) },
        outreachState: OutreachState.CONTACTED,
        status: JobRequestStatus.OPEN,
        timingPreference: "TIME_SLOT",
      },
      data: {
        attentionReason: "No bid has arrived for this scheduled request.",
        needsAttentionAt: new Date(),
        outreachState: OutreachState.NEEDS_ATTENTION,
      },
    }),
  ]);

  return asap.count + scheduled.count;
}

export async function expirePastOpenJobs() {
  const jobs = await prisma.jobRequest.findMany({
    where: { status: JobRequestStatus.OPEN },
    select: {
      createdAt: true,
      id: true,
      requestedDate: true,
      requestedWindowEnd: true,
      timingPreference: true,
    },
  });
  const now = new Date();
  const expiredIds = jobs.filter((job) => {
    if (job.timingPreference === "ASAP") {
      return now.getTime() - job.createdAt.getTime() > 24 * 60 * 60 * 1000;
    }
    if (!job.requestedDate || !job.requestedWindowEnd) return false;
    const date = job.requestedDate.toISOString().slice(0, 10);
    return new Date(`${date}T${job.requestedWindowEnd}:00`).getTime() <= now.getTime();
  }).map((job) => job.id);

  for (const id of expiredIds) {
    await prisma.$transaction([
      prisma.jobRequest.updateMany({
        where: { id, status: JobRequestStatus.OPEN },
        data: { status: JobRequestStatus.EXPIRED },
      }),
      prisma.jobBid.updateMany({
        where: { jobRequestId: id, status: BidStatus.SUBMITTED },
        data: {
          conversationClosedAt: now,
          conversationCloseReason: ConversationCloseReason.JOB_EXPIRED,
          status: BidStatus.DECLINED,
        },
      }),
    ]);
  }

  return expiredIds.length;
}
