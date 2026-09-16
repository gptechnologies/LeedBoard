import {
  JobOutreachStatus,
  OutreachChannel,
  OutreachEventType,
  ProviderApprovalStatus,
  UserRole,
  type Prisma,
  type ServiceNeed,
} from "@prisma/client";
import { randomBytes } from "node:crypto";
import {
  buildAppUrl,
  buildCleanerJobPostedEmail,
  markEmailDeliveryFailed,
  markEmailDeliverySent,
  sendTransactionalEmail,
} from "@/lib/email";
import { formatTimingSummary } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { getNewJobPushPayload, sendPushNotification } from "@/lib/push";
import { sendCleanerInviteSms } from "@/lib/sms";

const INVITE_TOKEN_DAYS = 14;

function getInviteTokenExpiresAt() {
  return new Date(Date.now() + INVITE_TOKEN_DAYS * 24 * 60 * 60 * 1000);
}

function createInviteToken() {
  return randomBytes(24).toString("base64url");
}

export function isOutreachExpired(outreach: { interestTokenExpiresAt: Date }) {
  return outreach.interestTokenExpiresAt <= new Date();
}

export async function createOutreachEvent(input: {
  jobOutreachId: string;
  eventType: OutreachEventType;
  payload?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
}) {
  const db = input.tx ?? prisma;

  await db.outreachEvent.create({
    data: {
      jobOutreachId: input.jobOutreachId,
      eventType: input.eventType,
      payload: input.payload ?? {},
    },
  });
}

export async function createJobOutreachForJob(input: {
  city: string;
  jobRequestId: string;
  postalCode: string;
  serviceNeeds: ServiceNeed[];
  state: string;
  externalLeadLimit?: number;
}) {
  const externalLeadLimit = input.externalLeadLimit ?? 10;
  const smsOutreachEnabled = process.env.ENABLE_SMS_OUTREACH === "true";
  const [cleaners, externalLeads] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: UserRole.CLEANER,
        cleanerProfile: {
          is: {
            isAvailable: true,
            approvalStatus: ProviderApprovalStatus.APPROVED,
          },
        },
      },
      include: {
        cleanerProfile: true,
      },
      take: 100,
    }),
    prisma.cleanerLead.findMany({
      where: {
        optedOutAt: null,
        linkedCleanerUserId: null,
        OR: [
          { postalCode: input.postalCode },
          { serviceAreaPostalCodes: { has: input.postalCode } },
        ],
      },
      orderBy: [
        { googleRating: "desc" },
        { googleReviewCount: "desc" },
        { updatedAt: "desc" },
      ],
      take: externalLeadLimit,
    }),
  ]);

  const matchedCleaners = cleaners.filter((cleaner) => {
    const profile = cleaner.cleanerProfile;
    if (!profile) return false;

    const zipMatch =
      profile.serviceAreaPostalCodes.length > 0 &&
      profile.serviceAreaPostalCodes.includes(input.postalCode);
    const serviceMatch =
      profile.serviceNeeds.length > 0 &&
      input.serviceNeeds.some((need) => profile.serviceNeeds.includes(need));

    return zipMatch && serviceMatch;
  });

  const existing = await prisma.jobOutreach.findMany({
    where: {
      jobRequestId: input.jobRequestId,
      cleanerUserId: {
        in: matchedCleaners.map((cleaner) => cleaner.id),
      },
      channel: OutreachChannel.APP,
    },
    select: {
      cleanerUserId: true,
    },
  });
  const existingCleanerIds = new Set(existing.map((item) => item.cleanerUserId).filter(Boolean));

  const createdSmsOutreachIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const cleaner of matchedCleaners) {
      if (existingCleanerIds.has(cleaner.id)) {
        continue;
      }

      const outreach = await tx.jobOutreach.create({
        data: {
          jobRequestId: input.jobRequestId,
          cleanerUserId: cleaner.id,
          channel: OutreachChannel.APP,
          status: JobOutreachStatus.PENDING,
          interestToken: createInviteToken(),
          interestTokenExpiresAt: getInviteTokenExpiresAt(),
        },
      });

      await createOutreachEvent({
        jobOutreachId: outreach.id,
        eventType: OutreachEventType.CREATED,
        payload: {
          channel: OutreachChannel.APP,
          cleanerUserId: cleaner.id,
        },
        tx,
      });

    }

    const existingLeadOutreaches = await tx.jobOutreach.findMany({
      where: {
        jobRequestId: input.jobRequestId,
        cleanerLeadId: {
          in: externalLeads.map((lead) => lead.id),
        },
      },
      select: {
        cleanerLeadId: true,
        channel: true,
      },
    });
    const existingLeadChannelKeys = new Set(
      existingLeadOutreaches.map((item) => `${item.cleanerLeadId}:${item.channel}`),
    );

    for (const lead of externalLeads) {
      if (lead.email && !existingLeadChannelKeys.has(`${lead.id}:${OutreachChannel.EMAIL}`)) {
        const emailOutreach = await tx.jobOutreach.create({
          data: {
            jobRequestId: input.jobRequestId,
            cleanerLeadId: lead.id,
            channel: OutreachChannel.EMAIL,
            status: JobOutreachStatus.PENDING,
            interestToken: createInviteToken(),
            interestTokenExpiresAt: getInviteTokenExpiresAt(),
          },
        });

        await createOutreachEvent({
          jobOutreachId: emailOutreach.id,
          eventType: OutreachEventType.CREATED,
          payload: {
            channel: OutreachChannel.EMAIL,
            cleanerLeadId: lead.id,
          },
          tx,
        });

      }

      if (smsOutreachEnabled && !existingLeadChannelKeys.has(`${lead.id}:${OutreachChannel.SMS}`)) {
        const smsOutreach = await tx.jobOutreach.create({
          data: {
            jobRequestId: input.jobRequestId,
            cleanerLeadId: lead.id,
            channel: OutreachChannel.SMS,
            status: JobOutreachStatus.PENDING,
            interestToken: createInviteToken(),
            interestTokenExpiresAt: getInviteTokenExpiresAt(),
          },
        });

        await createOutreachEvent({
          jobOutreachId: smsOutreach.id,
          eventType: OutreachEventType.CREATED,
          payload: {
            channel: OutreachChannel.SMS,
            cleanerLeadId: lead.id,
          },
          tx,
        });

        createdSmsOutreachIds.push(smsOutreach.id);
      }
    }
  });

  if (smsOutreachEnabled) {
    for (const outreachId of createdSmsOutreachIds) {
      await sendCleanerInviteSms(outreachId);
    }
  }

  const [appOutreachesToSend, leadEmailOutreachesToSend] = await Promise.all([
    prisma.jobOutreach.findMany({
      where: {
        jobRequestId: input.jobRequestId,
        channel: OutreachChannel.APP,
        cleanerUserId: { not: null },
        status: { in: [JobOutreachStatus.PENDING, JobOutreachStatus.FAILED] },
      },
      select: { cleanerUserId: true, id: true },
    }),
    prisma.jobOutreach.findMany({
      where: {
        jobRequestId: input.jobRequestId,
        channel: OutreachChannel.EMAIL,
        cleanerLeadId: { not: null },
        status: { in: [JobOutreachStatus.PENDING, JobOutreachStatus.FAILED] },
      },
      select: { cleanerLeadId: true, id: true },
    }),
  ]);

  const pushPayload = getNewJobPushPayload({
    city: input.city,
    jobId: input.jobRequestId,
    postalCode: input.postalCode,
    state: input.state,
  });

  for (const outreach of appOutreachesToSend) {
    if (!outreach.cleanerUserId) continue;
    const result = await sendPushNotification({
      userId: outreach.cleanerUserId,
      jobOutreachId: outreach.id,
      jobRequestId: input.jobRequestId,
      payload: pushPayload,
    });

    if (result.sent > 0) {
      await markOutreachSent(outreach.id, "PUSH");
    }
  }

  await sendJobPostedEmailsToCleaners({
    jobRequestId: input.jobRequestId,
    outreaches: appOutreachesToSend.flatMap((outreach) => outreach.cleanerUserId
      ? [{ cleanerUserId: outreach.cleanerUserId, outreachId: outreach.id }]
      : []),
  });

  await sendJobPostedEmailsToLeads({
    jobRequestId: input.jobRequestId,
    outreaches: leadEmailOutreachesToSend.flatMap((outreach) => outreach.cleanerLeadId
      ? [{ cleanerLeadId: outreach.cleanerLeadId, outreachId: outreach.id }]
      : []),
  });

  const [targetedCount, sentOutreaches, failedCount] = await Promise.all([
    prisma.jobOutreach.count({
      where: {
        jobRequestId: input.jobRequestId,
        channel: { in: [OutreachChannel.APP, OutreachChannel.EMAIL, OutreachChannel.SMS] },
      },
    }),
    prisma.jobOutreach.findMany({
      where: {
        jobRequestId: input.jobRequestId,
        channel: { in: [OutreachChannel.APP, OutreachChannel.EMAIL, OutreachChannel.SMS] },
        status: {
          in: [
            JobOutreachStatus.SENT,
            JobOutreachStatus.DELIVERED,
            JobOutreachStatus.INTERESTED,
            JobOutreachStatus.BID_SUBMITTED,
          ],
        },
      },
      select: { cleanerLeadId: true, cleanerUserId: true },
    }),
    prisma.jobOutreach.count({
      where: {
        jobRequestId: input.jobRequestId,
        status: JobOutreachStatus.FAILED,
      },
    }),
  ]);
  const sentCount = new Set(sentOutreaches.map((outreach) =>
    outreach.cleanerUserId ? `user:${outreach.cleanerUserId}` : `lead:${outreach.cleanerLeadId}`,
  )).size;

  return {
    eligibleCount: matchedCleaners.length + externalLeads.filter((lead) => Boolean(lead.email) || smsOutreachEnabled).length,
    failedCount,
    sentCount,
    targetedCount,
  };
}

async function sendJobPostedEmailsToCleaners(input: {
  jobRequestId: string;
  outreaches: Array<{
    cleanerUserId: string;
    outreachId: string;
  }>;
}) {
  if (input.outreaches.length === 0) {
    return;
  }

  const job = await prisma.jobRequest.findUnique({
    where: { id: input.jobRequestId },
    include: {
      homeProfile: {
        select: {
          bathroomCount: true,
          bedroomCount: true,
          estimatedSquareFeet: true,
        },
      },
    },
  });

  if (!job) {
    return;
  }

  const cleaners = await prisma.user.findMany({
    where: {
      id: {
        in: input.outreaches.map((outreach) => outreach.cleanerUserId),
      },
      email: {
        not: null,
      },
    },
    select: {
      email: true,
      id: true,
    },
  });
  const cleanerById = new Map(cleaners.map((cleaner) => [cleaner.id, cleaner]));
  const jobUrl = buildAppUrl(`/cleaner/jobs/${job.id}`);
  const emailContent = buildCleanerJobPostedEmail({
    city: job.city,
    homeFacts: formatHomeFacts({
      bathroomCount: job.snapshotBathroomCount ?? job.homeProfile?.bathroomCount ?? null,
      bedroomCount: job.snapshotBedroomCount ?? job.homeProfile?.bedroomCount ?? null,
      estimatedSquareFeet: job.snapshotEstimatedSquareFeet ?? job.homeProfile?.estimatedSquareFeet ?? null,
    }),
    jobUrl,
    notes: job.notes,
    postalCode: job.postalCode,
    state: job.state,
    timing: formatTimingSummary(job),
  });

  for (const outreach of input.outreaches) {
    const cleaner = cleanerById.get(outreach.cleanerUserId);
    if (!cleaner?.email) {
      continue;
    }

    const payload: Prisma.InputJsonObject = {
      jobUrl,
      purpose: "cleaner_job_posted",
      subject: emailContent.subject,
    };
    const dedupeKey = `job-posted:${job.id}:${cleaner.id}:email`;
    const delivery = await prisma.notificationDelivery.upsert({
      where: { dedupeKey },
      update: {
        failureReason: null,
        status: "PENDING",
      },
      create: {
        channel: "EMAIL",
        dedupeKey,
        toEmail: cleaner.email,
        payload,
        jobOutreachId: outreach.outreachId,
        jobRequestId: job.id,
        userId: cleaner.id,
      },
    });

    try {
      const result = await sendTransactionalEmail({
        to: cleaner.email,
        subject: emailContent.subject,
        text: emailContent.text,
        idempotencyKey: dedupeKey,
      });

      await markEmailDeliverySent({
        deliveryId: delivery.id,
        providerMessageId: result.providerMessageId,
      });

      await createOutreachEvent({
        jobOutreachId: outreach.outreachId,
        eventType: OutreachEventType.SENT,
        payload: {
          channel: "EMAIL",
          providerMessageId: result.providerMessageId,
        },
      });
      await markOutreachSent(outreach.outreachId, "EMAIL");
    } catch (error) {
      const failureReason =
        error instanceof Error ? error.message : "Unable to send job posted email.";
      await markEmailDeliveryFailed({
        deliveryId: delivery.id,
        failureReason,
      });
      await createOutreachEvent({
        jobOutreachId: outreach.outreachId,
        eventType: OutreachEventType.FAILED,
        payload: {
          channel: "EMAIL",
          reason: failureReason,
        },
      });
      await markOutreachFailed(outreach.outreachId, failureReason);
    }
  }
}

async function sendJobPostedEmailsToLeads(input: {
  jobRequestId: string;
  outreaches: Array<{
    cleanerLeadId: string;
    outreachId: string;
  }>;
}) {
  if (input.outreaches.length === 0) return;

  const [job, leads] = await Promise.all([
    prisma.jobRequest.findUnique({
      where: { id: input.jobRequestId },
    }),
    prisma.cleanerLead.findMany({
      where: { id: { in: input.outreaches.map((item) => item.cleanerLeadId) } },
      select: { email: true, id: true },
    }),
  ]);
  if (!job) return;

  const leadById = new Map(leads.map((lead) => [lead.id, lead]));

  for (const outreach of input.outreaches) {
    const lead = leadById.get(outreach.cleanerLeadId);
    if (!lead?.email) continue;

    const row = await prisma.jobOutreach.findUnique({
      where: { id: outreach.outreachId },
      select: { interestToken: true },
    });
    if (!row) continue;

    const jobUrl = buildAppUrl(`/invite/cleaner/${row.interestToken}`);
    const content = buildCleanerJobPostedEmail({
      city: job.city,
      homeFacts: formatHomeFacts({
        bathroomCount: job.snapshotBathroomCount,
        bedroomCount: job.snapshotBedroomCount,
        estimatedSquareFeet: job.snapshotEstimatedSquareFeet,
      }),
      jobUrl,
      notes: job.notes,
      postalCode: job.postalCode,
      state: job.state,
      timing: formatTimingSummary(job),
    });
    const dedupeKey = `job-posted:${job.id}:${lead.id}:lead-email`;
    const payload: Prisma.InputJsonObject = {
      jobUrl,
      purpose: "provider_job_posted",
      subject: content.subject,
    };
    const delivery = await prisma.notificationDelivery.upsert({
      where: { dedupeKey },
      update: { failureReason: null, status: "PENDING" },
      create: {
        channel: "EMAIL",
        cleanerLeadId: lead.id,
        dedupeKey,
        jobOutreachId: outreach.outreachId,
        jobRequestId: job.id,
        payload,
        toEmail: lead.email,
      },
    });

    try {
      const result = await sendTransactionalEmail({
        idempotencyKey: dedupeKey,
        subject: content.subject,
        text: content.text,
        to: lead.email,
      });
      await markEmailDeliverySent({
        deliveryId: delivery.id,
        providerMessageId: result.providerMessageId,
      });
      await createOutreachEvent({
        jobOutreachId: outreach.outreachId,
        eventType: OutreachEventType.SENT,
        payload: { channel: "EMAIL", providerMessageId: result.providerMessageId },
      });
      await markOutreachSent(outreach.outreachId, "EMAIL");
    } catch (error) {
      const failureReason = error instanceof Error ? error.message : "Unable to send provider email.";
      await markEmailDeliveryFailed({ deliveryId: delivery.id, failureReason });
      await createOutreachEvent({
        jobOutreachId: outreach.outreachId,
        eventType: OutreachEventType.FAILED,
        payload: { channel: "EMAIL", reason: failureReason },
      });
      await markOutreachFailed(outreach.outreachId, failureReason);
    }
  }
}

async function markOutreachSent(outreachId: string, channel: string) {
  await prisma.jobOutreach.update({
    where: { id: outreachId },
    data: {
      failureReason: null,
      lastAttemptAt: new Date(),
      status: JobOutreachStatus.SENT,
    },
  });
  void channel;
}

async function markOutreachFailed(outreachId: string, failureReason: string) {
  await prisma.jobOutreach.updateMany({
    where: {
      id: outreachId,
      status: { notIn: [JobOutreachStatus.SENT, JobOutreachStatus.DELIVERED, JobOutreachStatus.BID_SUBMITTED] },
    },
    data: {
      failureReason,
      lastAttemptAt: new Date(),
      status: JobOutreachStatus.FAILED,
    },
  });
}

function formatHomeFacts(input: {
  bathroomCount?: number | null;
  bedroomCount?: number | null;
  estimatedSquareFeet?: number | null;
}) {
  const bedroomLabel =
    input.bedroomCount === null || input.bedroomCount === undefined
      ? null
      : `${input.bedroomCount} bed`;
  const bathroomLabel =
    input.bathroomCount === null || input.bathroomCount === undefined
      ? null
      : `${Number.isInteger(input.bathroomCount)
          ? input.bathroomCount.toFixed(0)
          : input.bathroomCount} bath`;
  const squareFeetLabel = input.estimatedSquareFeet
    ? `${input.estimatedSquareFeet.toLocaleString("en-US")} sq ft`
    : null;

  return [bedroomLabel, bathroomLabel, squareFeetLabel].filter(Boolean).join(" / ") ||
    "Home details are in the job link";
}

export async function markOutreachInterested(outreachId: string) {
  return prisma.$transaction(async (tx) => {
    const outreach = await tx.jobOutreach.update({
      where: { id: outreachId },
      data: {
        status: JobOutreachStatus.INTERESTED,
      },
    });

    await createOutreachEvent({
      jobOutreachId: outreach.id,
      eventType: OutreachEventType.INTERESTED,
      tx,
    });

    return outreach;
  });
}

export async function markOutreachNotInterested(outreachId: string) {
  return prisma.$transaction(async (tx) => {
    const outreach = await tx.jobOutreach.update({
      where: { id: outreachId },
      data: {
        status: JobOutreachStatus.NOT_INTERESTED,
      },
    });

    await createOutreachEvent({
      jobOutreachId: outreach.id,
      eventType: OutreachEventType.NOT_INTERESTED,
      tx,
    });

    return outreach;
  });
}

export async function completeOutreachOnboarding(input: {
  outreachId: string;
  cleanerUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const outreach = await tx.jobOutreach.update({
      where: { id: input.outreachId },
      data: {
        cleanerUserId: input.cleanerUserId,
        status: JobOutreachStatus.ONBOARDED,
      },
    });

    if (outreach.cleanerLeadId) {
      await tx.cleanerLead.update({
        where: { id: outreach.cleanerLeadId },
        data: {
          linkedCleanerUserId: input.cleanerUserId,
        },
      });
    }

    await createOutreachEvent({
      jobOutreachId: outreach.id,
      eventType: OutreachEventType.ONBOARDED,
      payload: {
        cleanerUserId: input.cleanerUserId,
      },
      tx,
    });

    return outreach;
  });
}

export async function attributeBidToOutreach(input: {
  jobRequestId: string;
  cleanerId: string;
  bidId: string;
}) {
  const outreach = await prisma.jobOutreach.findFirst({
    where: {
      jobRequestId: input.jobRequestId,
      cleanerUserId: input.cleanerId,
      status: {
        in: [
          JobOutreachStatus.PENDING,
          JobOutreachStatus.SENT,
          JobOutreachStatus.DELIVERED,
          JobOutreachStatus.INTERESTED,
          JobOutreachStatus.INVITE_SENT,
          JobOutreachStatus.ONBOARDED,
        ],
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!outreach) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.jobOutreach.update({
      where: { id: outreach.id },
      data: {
        bidId: input.bidId,
        status: JobOutreachStatus.BID_SUBMITTED,
      },
    });

    await createOutreachEvent({
      jobOutreachId: updated.id,
      eventType: OutreachEventType.BID_SUBMITTED,
      payload: {
        bidId: input.bidId,
      },
      tx,
    });

    return updated;
  });
}
