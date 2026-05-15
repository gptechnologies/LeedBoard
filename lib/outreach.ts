import {
  JobOutreachStatus,
  OutreachChannel,
  OutreachEventType,
  UserRole,
  type Prisma,
  type ServiceNeed,
} from "@prisma/client";
import { randomBytes } from "node:crypto";
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
      if (!existingLeadChannelKeys.has(`${lead.id}:${OutreachChannel.SMS}`)) {
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

  for (const outreachId of createdSmsOutreachIds) {
    await sendCleanerInviteSms(outreachId);
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
