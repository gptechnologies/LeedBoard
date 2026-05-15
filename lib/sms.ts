import {
  JobOutreachStatus,
  NotificationChannel,
  NotificationStatus,
  OutreachEventType,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatTimingSummary } from "@/lib/marketplace";
import { getCleaningJobTitle } from "@/lib/job-title";

const TWILIO_MESSAGES_URL = "https://api.twilio.com/2010-04-01/Accounts";

function getTwilioMessagingConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromPhoneNumber = process.env.TWILIO_FROM_PHONE_NUMBER;

  if (!accountSid || !authToken || (!messagingServiceSid && !fromPhoneNumber)) {
    return null;
  }

  return {
    accountSid,
    authToken,
    fromPhoneNumber,
    messagingServiceSid,
  };
}

function getAuthorizationHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ||
    "http://localhost:3000"
  );
}

function getTwilioStatusCallbackUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl.replace(/\/$/, "")}/api/webhooks/twilio/messaging`;
}

export function buildCleanerInviteUrl(token: string) {
  return `${getAppBaseUrl().replace(/\/$/, "")}/invite/cleaner/${token}`;
}

export function buildCleanerInviteSms(input: {
  bathroomCount?: number | null;
  bedroomCount?: number | null;
  city: string;
  estimatedSquareFeet?: number | null;
  notes?: string | null;
  state: string;
  timing: string;
  postalCode: string;
  inviteUrl: string;
}) {
  return [
    `New Well Kept cleaning job near ${input.city}, ${input.state} ${input.postalCode}`,
    "",
    `When: ${input.timing}`,
    `Home: ${formatHomeFacts(input)}`,
    `Notes: ${input.notes?.trim() || "Cleaning details are in the job link."}`,
    "",
    `Bid here-> ${input.inviteUrl}`,
    "",
    "Reply STOP to opt out.",
  ].join("\n");
}

export async function sendCleanerInviteSms(jobOutreachId: string) {
  const outreach = await prisma.jobOutreach.findUnique({
    where: { id: jobOutreachId },
    include: {
      cleanerLead: true,
      jobRequest: {
        include: {
          homeProfile: {
            select: {
              bathroomCount: true,
              bedroomCount: true,
              estimatedSquareFeet: true,
              propertyType: true,
            },
          },
        },
      },
    },
  });

  if (!outreach?.cleanerLead) {
    return null;
  }

  const lead = outreach.cleanerLead;
  const inviteUrl = buildCleanerInviteUrl(outreach.interestToken);
  const body = buildCleanerInviteSms({
    bathroomCount: outreach.jobRequest.homeProfile?.bathroomCount ?? null,
    bedroomCount: outreach.jobRequest.homeProfile?.bedroomCount ?? null,
    city: outreach.jobRequest.city,
    estimatedSquareFeet: outreach.jobRequest.homeProfile?.estimatedSquareFeet ?? null,
    notes: outreach.jobRequest.notes,
    state: outreach.jobRequest.state,
    timing: formatSmsTiming(outreach.jobRequest),
    postalCode: outreach.jobRequest.postalCode,
    inviteUrl,
  });
  const payload: Prisma.InputJsonObject = {
    body,
    inviteUrl,
  };

  const delivery = await prisma.notificationDelivery.create({
    data: {
      channel: NotificationChannel.SMS,
      status: NotificationStatus.PENDING,
      toPhone: lead.phone,
      payload,
      jobOutreachId: outreach.id,
      jobRequestId: outreach.jobRequestId,
      cleanerLeadId: lead.id,
    },
  });

  if (lead.optedOutAt) {
    await markSmsSkipped({
      deliveryId: delivery.id,
      outreachId: outreach.id,
      reason: "Cleaner lead has opted out.",
      status: NotificationStatus.OPTED_OUT,
    });
    return delivery;
  }

  const config = getTwilioMessagingConfig();
  if (!config) {
    await markSmsSkipped({
      deliveryId: delivery.id,
      outreachId: outreach.id,
      reason: "Twilio messaging is not configured.",
      status: NotificationStatus.SKIPPED,
    });
    return delivery;
  }

  const bodyParams = new URLSearchParams({
    To: lead.phone,
    Body: body,
  });

  if (config.messagingServiceSid) {
    bodyParams.set("MessagingServiceSid", config.messagingServiceSid);
  } else if (config.fromPhoneNumber) {
    bodyParams.set("From", config.fromPhoneNumber);
  }

  const statusCallback = getTwilioStatusCallbackUrl();
  if (statusCallback) {
    bodyParams.set("StatusCallback", statusCallback);
  }

  const response = await fetch(
    `${TWILIO_MESSAGES_URL}/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthorizationHeader(config.accountSid, config.authToken),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams,
    },
  );

  if (!response.ok) {
    const failureReason = `Twilio SMS failed with ${response.status}.`;
    await markSmsSkipped({
      deliveryId: delivery.id,
      outreachId: outreach.id,
      reason: failureReason,
      status: NotificationStatus.FAILED,
    });
    return delivery;
  }

  const result = (await response.json()) as { sid?: string; status?: string };

  await prisma.$transaction(async (tx) => {
    await tx.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        providerMessageId: result.sid ?? null,
        sentAt: new Date(),
        status: NotificationStatus.SENT,
      },
    });

    await tx.jobOutreach.update({
      where: { id: outreach.id },
      data: {
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
        providerMessageId: result.sid ?? null,
        status: JobOutreachStatus.SENT,
      },
    });

    await tx.outreachEvent.create({
      data: {
        jobOutreachId: outreach.id,
        eventType: OutreachEventType.SENT,
        payload: {
          channel: NotificationChannel.SMS,
          providerMessageId: result.sid ?? null,
          twilioStatus: result.status ?? null,
        },
      },
    });
  });

  return delivery;
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

function formatSmsTiming(job: Parameters<typeof formatTimingSummary>[0]) {
  if (job.timingPreference === "ASAP") {
    return "ASAP";
  }

  if (!job.requestedDate || !job.requestedWindowStart) {
    return formatTimingSummary(job);
  }

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const dateLabel = isSameDay(job.requestedDate, today)
    ? "Today"
    : isSameDay(job.requestedDate, tomorrow)
      ? "Tomorrow"
      : job.requestedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

  return `${dateLabel}, ${formatSmsClock(job.requestedWindowStart)}`;
}

function formatSmsClock(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

async function markSmsSkipped(input: {
  deliveryId: string;
  outreachId: string;
  reason: string;
  status: NotificationStatus;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.notificationDelivery.update({
      where: { id: input.deliveryId },
      data: {
        failureReason: input.reason,
        status: input.status,
      },
    });

    await tx.jobOutreach.update({
      where: { id: input.outreachId },
      data: {
        failureReason: input.reason,
        status:
          input.status === NotificationStatus.OPTED_OUT
            ? JobOutreachStatus.OPTED_OUT
            : input.status === NotificationStatus.FAILED
              ? JobOutreachStatus.FAILED
              : JobOutreachStatus.PENDING,
      },
    });

    await tx.outreachEvent.create({
      data: {
        jobOutreachId: input.outreachId,
        eventType:
          input.status === NotificationStatus.OPTED_OUT
            ? OutreachEventType.OPTED_OUT
            : input.status === NotificationStatus.FAILED
              ? OutreachEventType.FAILED
              : OutreachEventType.NOTE_ADDED,
        payload: {
          channel: NotificationChannel.SMS,
          reason: input.reason,
        },
      },
    });
  });
}
