import { NotificationChannel, NotificationStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

type EmailResult = {
  providerMessageId: string | null;
};

type SendEmailInput = {
  html?: string;
  idempotencyKey?: string;
  replyTo?: string;
  subject: string;
  text: string;
  to: string;
};

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return null;
  }

  return {
    apiKey,
    from,
  };
}

export function isEmailDeliveryConfigured() {
  return Boolean(getResendConfig());
}

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ||
    "http://localhost:3000"
  );
}

export function buildAppUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppBaseUrl().replace(/\/$/, "")}${normalizedPath}`;
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<EmailResult> {
  const config = getResendConfig();

  if (!config) {
    throw new Error("Email delivery is not configured.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (input.idempotencyKey) {
    headers["Idempotency-Key"] = input.idempotencyKey;
  }

  const response = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? textToHtml(input.text),
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
  });

  const result = (await response.json().catch(() => null)) as {
    id?: string;
    message?: string;
    name?: string;
  } | null;

  if (!response.ok) {
    throw new Error(result?.message || `Resend email failed with ${response.status}.`);
  }

  return {
    providerMessageId: result?.id ?? null,
  };
}

export async function createEmailDelivery(input: {
  dedupeKey?: string | null;
  jobOutreachId?: string | null;
  jobRequestId?: string | null;
  payload: Prisma.InputJsonObject;
  toEmail: string;
  userId?: string | null;
}) {
  return prisma.notificationDelivery.create({
    data: {
      dedupeKey: input.dedupeKey ?? null,
      channel: NotificationChannel.EMAIL,
      status: NotificationStatus.PENDING,
      toEmail: input.toEmail,
      payload: input.payload,
      jobOutreachId: input.jobOutreachId ?? null,
      jobRequestId: input.jobRequestId ?? null,
      userId: input.userId ?? null,
    },
  });
}

export async function markEmailDeliverySent(input: {
  deliveryId: string;
  providerMessageId: string | null;
}) {
  return prisma.notificationDelivery.update({
    where: { id: input.deliveryId },
    data: {
      providerMessageId: input.providerMessageId,
      sentAt: new Date(),
      status: NotificationStatus.SENT,
    },
  });
}

export async function markEmailDeliveryFailed(input: {
  deliveryId: string;
  failureReason: string;
}) {
  return prisma.notificationDelivery.update({
    where: { id: input.deliveryId },
    data: {
      failureReason: input.failureReason,
      status: NotificationStatus.FAILED,
    },
  });
}

export function buildOtpEmail(input: { code: string }) {
  return {
    subject: "Your Well Kept code",
    text: [
      `Your Well Kept verification code is ${input.code}.`,
      "",
      "This code expires in 10 minutes.",
      "",
      "If you did not request this code, you can ignore this email.",
    ].join("\n"),
  };
}

export function buildCleanerJobPostedEmail(input: {
  city: string;
  homeFacts: string;
  jobUrl: string;
  notes?: string | null;
  postalCode: string;
  state: string;
  timing: string;
}) {
  const text = [
    `New Well Kept cleaning job near ${input.city}, ${input.state} ${input.postalCode}`,
    "",
    `When: ${input.timing}`,
    `Home: ${input.homeFacts}`,
    `Notes: ${input.notes?.trim() || "Cleaning details are in the job link."}`,
    "",
    `Bid here-> ${input.jobUrl}`,
  ].join("\n");

  return {
    subject: `New cleaning job near ${input.city}, ${input.state}`,
    text,
  };
}

export function buildHomeownerBidReceivedEmail(input: {
  bidUrl: string;
  cleanerName: string;
  jobTitle: string;
  price: string;
  timing: string;
}) {
  return {
    subject: `New bid for ${input.jobTitle}`,
    text: [
      `${input.cleanerName} submitted a bid for ${input.jobTitle}.`,
      "",
      `Price: ${input.price}`,
      `Timing: ${input.timing}`,
      "",
      `Review the bid: ${input.bidUrl}`,
    ].join("\n"),
  };
}

export function buildCleanerBidAcceptedEmail(input: {
  activityUrl: string;
  jobTitle: string;
  timing: string;
}) {
  return {
    subject: `Your bid was accepted for ${input.jobTitle}`,
    text: [
      `The homeowner accepted your bid for ${input.jobTitle}.`,
      "",
      `Timing: ${input.timing}`,
      "",
      "The exact address and access details are now available in Well Kept.",
      `View the active job: ${input.activityUrl}`,
    ].join("\n"),
  };
}

export function buildJobCompletedEmail(input: {
  activityUrl: string;
  jobTitle: string;
  recipientName: string;
}) {
  return {
    subject: `${input.jobTitle} was marked complete`,
    text: [
      `Hi ${input.recipientName},`,
      "",
      `${input.jobTitle} was marked complete.`,
      "",
      `Review the job: ${input.activityUrl}`,
    ].join("\n"),
  };
}

function textToHtml(text: string) {
  return `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
