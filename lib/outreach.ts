import {
  JobOutreachStatus,
  OutreachChannel,
  OutreachEventType,
  UserRole,
  type Prisma,
  type ServiceNeed,
} from "@prisma/client";
import { randomBytes } from "node:crypto";
import {
  buildAppUrl,
  buildCleanerJobPostedEmail,
  createEmailDelivery,
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
          },
        },
      },
      include: {
        cleanerProfile: true,
      },
      take: 24,
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
      profile.serviceAreaPostalCodes.length === 0 ||
      profile.serviceAreaPostalCodes.includes(input.postalCode);
    const serviceMatch =
      profile.serviceNeeds.length === 0 ||
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
  const createdAppOutreaches: Array<{
    cleanerUserId: string;
    outreachId: string;
  }> = [];

  await prisma.$transaction(async (tx) => {
    let createdCount = 0;

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

      createdAppOutreaches.push({
        cleanerUserId: cleaner.id,
        outreachId: outreach.id,
      });
      createdCount += 1;
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
        createdCount += 1;
      }

      if (!existingLeadChannelKeys.has(`${lead.id}:${OutreachChannel.MANUAL_CALL}`)) {
        const callOutreach = await tx.jobOutreach.create({
          data: {
            jobRequestId: input.jobRequestId,
            cleanerLeadId: lead.id,
            channel: OutreachChannel.MANUAL_CALL,
            status: JobOutreachStatus.PENDING,
            interestToken: createInviteToken(),
            interestTokenExpiresAt: getInviteTokenExpiresAt(),
            notes: "Call to confirm time and location work, then send the invite link if interested.",
          },
        });

        await createOutreachEvent({
          jobOutreachId: callOutreach.id,
          eventType: OutreachEventType.CREATED,
          payload: {
            channel: OutreachChannel.MANUAL_CALL,
            cleanerLeadId: lead.id,
          },
          tx,
        });

        createdCount += 1;
      }
    }

    if (createdCount > 0) {
      await tx.jobRequest.update({
        where: { id: input.jobRequestId },
        data: {
          cleanersNotifiedCount: {
            increment: createdCount,
          },
        },
      });
    }
  });

  if (smsOutreachEnabled) {
    for (const outreachId of createdSmsOutreachIds) {
      await sendCleanerInviteSms(outreachId);
    }
  }

  const pushPayload = getNewJobPushPayload({
    city: input.city,
    jobId: input.jobRequestId,
    postalCode: input.postalCode,
    state: input.state,
  });

  for (const outreach of createdAppOutreaches) {
    await sendPushNotification({
      userId: outreach.cleanerUserId,
      jobOutreachId: outreach.outreachId,
      jobRequestId: input.jobRequestId,
      payload: pushPayload,
    });
  }

  await sendJobPostedEmailsToCleaners({
    jobRequestId: input.jobRequestId,
    outreaches: createdAppOutreaches,
  });
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
      bathroomCount: job.homeProfile?.bathroomCount ?? null,
      bedroomCount: job.homeProfile?.bedroomCount ?? null,
      estimatedSquareFeet: job.homeProfile?.estimatedSquareFeet ?? null,
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
    const delivery = await createEmailDelivery({
      toEmail: cleaner.email,
      payload,
      jobOutreachId: outreach.outreachId,
      jobRequestId: job.id,
      userId: cleaner.id,
    });

    try {
      const result = await sendTransactionalEmail({
        to: cleaner.email,
        subject: emailContent.subject,
        text: emailContent.text,
        idempotencyKey: `job-posted-${delivery.id}`,
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
    }
  }
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
