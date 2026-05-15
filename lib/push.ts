import {
  NotificationChannel,
  NotificationStatus,
  OutreachEventType,
  type Prisma,
} from "@prisma/client";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type PushPayload = {
  body: string;
  title: string;
  url: string;
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@wellkept.com";

  if (!publicKey || !privateKey) {
    return null;
  }

  return {
    publicKey,
    privateKey,
    subject,
  };
}

function configureWebPush() {
  const config = getVapidConfig();

  if (!config) {
    return false;
  }

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

export async function sendPushNotification(input: {
  userId: string;
  jobOutreachId?: string | null;
  jobRequestId?: string | null;
  payload: PushPayload;
}) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: input.userId,
      disabledAt: null,
    },
  });

  if (subscriptions.length === 0) {
    return {
      sent: 0,
      skipped: true,
    };
  }

  const payload: Prisma.InputJsonObject = {
    ...input.payload,
  };

  if (!configureWebPush()) {
    await prisma.notificationDelivery.create({
      data: {
        channel: NotificationChannel.PUSH,
        status: NotificationStatus.SKIPPED,
        failureReason: "VAPID push configuration is missing.",
        payload,
        jobOutreachId: input.jobOutreachId ?? null,
        jobRequestId: input.jobRequestId ?? null,
        userId: input.userId,
      },
    });

    return {
      sent: 0,
      skipped: true,
    };
  }

  let sent = 0;

  for (const subscription of subscriptions) {
    const delivery = await prisma.notificationDelivery.create({
      data: {
        channel: NotificationChannel.PUSH,
        status: NotificationStatus.PENDING,
        payload,
        jobOutreachId: input.jobOutreachId ?? null,
        jobRequestId: input.jobRequestId ?? null,
        userId: input.userId,
      },
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.auth,
            p256dh: subscription.p256dh,
          },
        },
        JSON.stringify(input.payload),
      );

      sent += 1;

      await prisma.$transaction(async (tx) => {
        await tx.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });

        await tx.pushSubscription.update({
          where: { id: subscription.id },
          data: {
            lastUsedAt: new Date(),
          },
        });

        if (input.jobOutreachId) {
          await tx.outreachEvent.create({
            data: {
              jobOutreachId: input.jobOutreachId,
              eventType: OutreachEventType.SENT,
              payload: {
                channel: NotificationChannel.PUSH,
                title: input.payload.title,
              },
            },
          });
        }
      });
    } catch (error) {
      const statusCode =
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        typeof error.statusCode === "number"
          ? error.statusCode
          : null;
      const failureReason =
        error instanceof Error ? error.message : "Unable to send push notification.";

      await prisma.$transaction(async (tx) => {
        await tx.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: NotificationStatus.FAILED,
            failureReason,
          },
        });

        if (statusCode === 404 || statusCode === 410) {
          await tx.pushSubscription.update({
            where: { id: subscription.id },
            data: {
              disabledAt: new Date(),
            },
          });
        }

        if (input.jobOutreachId) {
          await tx.outreachEvent.create({
            data: {
              jobOutreachId: input.jobOutreachId,
              eventType: OutreachEventType.FAILED,
              payload: {
                channel: NotificationChannel.PUSH,
                reason: failureReason,
              },
            },
          });
        }
      });
    }
  }

  return {
    sent,
    skipped: false,
  };
}

export function getNewJobPushPayload(input: {
  city: string;
  jobId: string;
  postalCode: string;
  state: string;
}) {
  return {
    title: "New Job Request",
    body: `New Job Request near ${input.city}, ${input.state} ${input.postalCode}`,
    url: `/cleaner/jobs/${input.jobId}`,
  };
}
