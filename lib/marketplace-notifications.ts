import type { User } from "@prisma/client";

import {
  buildAppUrl,
  buildCleanerBidAcceptedEmail,
  buildConnectionSummaryEmail,
  buildHomeownerBidReceivedEmail,
  buildJobCompletedEmail,
  markEmailDeliveryFailed,
  markEmailDeliverySent,
  sendTransactionalEmail,
} from "@/lib/email";
import { getCleaningJobTitle } from "@/lib/job-title";
import { formatBidAmount, formatBidTiming, formatTimingSummary } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";

type BidForNotification = {
  id: string;
  pricingType: "HOURLY" | "FLAT";
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  estimatedHours: number | null;
  etaMinutes: number | null;
  arrivalDate: Date | null;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
};

export async function notifyHomeownerOfBid(input: {
  bid: BidForNotification;
  providerName: string;
  job: {
    id: string;
    title: string;
    customer: Pick<User, "email" | "id">;
    homeProfile?: { propertyType: "HOUSE" | "APARTMENT" } | null;
  };
}) {
  if (!input.job.customer.email) return;
  const content = buildHomeownerBidReceivedEmail({
    bidUrl: buildAppUrl(`/customer/jobs/${input.job.id}/bids`),
    cleanerName: input.providerName,
    jobTitle: getCleaningJobTitle(input.job),
    price: formatBidAmount(input.bid),
    timing: formatBidTiming(input.bid),
  });

  await sendMarketplaceEmail({
    content,
    dedupeKey: `bid-received:${input.bid.id}`,
    jobRequestId: input.job.id,
    purpose: "homeowner_bid_received",
    toEmail: input.job.customer.email,
    userId: input.job.customer.id,
  });
}

export async function notifyCleanerOfAcceptance(input: {
  bidId: string;
  cleaner: Pick<User, "email" | "id"> | null;
  job: Parameters<typeof formatTimingSummary>[0] & {
    id: string;
    title: string;
    homeProfile?: { propertyType: "HOUSE" | "APARTMENT" } | null;
  };
}) {
  if (!input.cleaner?.email) return;
  const content = buildCleanerBidAcceptedEmail({
    activityUrl: buildAppUrl(`/cleaner/messages/${input.bidId}`),
    jobTitle: getCleaningJobTitle(input.job),
    timing: formatTimingSummary(input.job),
  });

  await sendMarketplaceEmail({
    content,
    dedupeKey: `bid-accepted:${input.bidId}`,
    jobRequestId: input.job.id,
    purpose: "cleaner_bid_accepted",
    toEmail: input.cleaner.email,
    userId: input.cleaner.id,
  });
}

export async function notifyHomeownerOfCompletion(input: {
  bidId: string;
  customer: Pick<User, "email" | "firstName" | "id">;
  job: { id: string; title: string; homeProfile?: { propertyType: "HOUSE" | "APARTMENT" } | null };
}) {
  if (!input.customer.email) return;
  const content = buildJobCompletedEmail({
    activityUrl: buildAppUrl(`/customer/messages/${input.bidId}`),
    jobTitle: getCleaningJobTitle(input.job),
    recipientName: input.customer.firstName || "there",
  });

  await sendMarketplaceEmail({
    content,
    dedupeKey: `job-completed:${input.job.id}:${input.customer.id}`,
    jobRequestId: input.job.id,
    purpose: "job_completed",
    toEmail: input.customer.email,
    userId: input.customer.id,
  });
}

export type ConnectionSummaryInput = {
  bid: BidForNotification & {
    cleaner: Pick<User, "email" | "firstName" | "id" | "lastName" | "phone"> | null;
    cleanerLead: { email: string | null; id: string; name: string | null; businessName: string | null; phone: string } | null;
    message: string | null;
    createdAt: Date;
    messages: Array<{ body: string; createdAt: Date; sender: "CUSTOMER" | "CLEANER" }>;
  };
  customer: Pick<User, "email" | "firstName" | "id" | "lastName" | "phone">;
  job: Parameters<typeof formatTimingSummary>[0] & {
    id: string;
    title: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    homeProfile?: { propertyType: "HOUSE" | "APARTMENT" } | null;
  };
};

export function getConnectionSummaryDeliveries(input: ConnectionSummaryInput) {
  const homeownerName = `${input.customer.firstName} ${input.customer.lastName}`.trim();
  const providerName = input.bid.cleanerLead?.businessName || input.bid.cleanerLead?.name ||
    (input.bid.cleaner ? `${input.bid.cleaner.firstName} ${input.bid.cleaner.lastName}`.trim() : "Cleaning provider");
  const providerEmail = input.bid.cleanerLead?.email || input.bid.cleaner?.email;
  const providerPhone = input.bid.cleanerLead?.phone || input.bid.cleaner?.phone;
  if (!input.customer.email || !input.customer.phone || !providerEmail || !providerPhone) return [];

  const transcript = [
    ...(input.bid.message?.trim() ? [{ at: input.bid.createdAt, body: input.bid.message.trim(), sender: "Provider" as const }] : []),
    ...input.bid.messages.map((message) => ({
      at: message.createdAt,
      body: message.body,
      sender: message.sender === "CUSTOMER" ? "Homeowner" as const : "Provider" as const,
    })),
  ];
  const shared = {
    address: [input.job.addressLine1, input.job.addressLine2, `${input.job.city}, ${input.job.state} ${input.job.postalCode}`].filter(Boolean).join(", "),
    homeownerName,
    homeownerPhone: input.customer.phone,
    jobTitle: getCleaningJobTitle(input.job),
    price: formatBidAmount(input.bid),
    providerName,
    providerPhone,
    timing: formatBidTiming(input.bid),
    transcript,
  };

  return [
    {
      content: buildConnectionSummaryEmail({ ...shared, recipientName: input.customer.firstName || "there" }),
      dedupeKey: `handoff:${input.job.id}:homeowner`,
      jobRequestId: input.job.id,
      purpose: "connection_summary_homeowner",
      toEmail: input.customer.email,
      userId: input.customer.id,
    },
    {
      content: buildConnectionSummaryEmail({ ...shared, recipientName: input.bid.cleaner?.firstName || providerName }),
      dedupeKey: `handoff:${input.job.id}:provider`,
      jobRequestId: input.job.id,
      purpose: "connection_summary_provider",
      toEmail: providerEmail,
      userId: input.bid.cleaner?.id ?? null,
    },
  ];
}

export async function sendConnectionSummaryEmails(input: ConnectionSummaryInput) {
  await Promise.all(getConnectionSummaryDeliveries(input).map(sendMarketplaceEmail));
}

async function sendMarketplaceEmail(input: {
  content: { subject: string; text: string };
  dedupeKey: string;
  jobRequestId: string;
  purpose: string;
  toEmail: string;
  userId: string | null;
}) {
  const delivery = await prisma.notificationDelivery.upsert({
    where: { dedupeKey: input.dedupeKey },
    create: {
      channel: "EMAIL",
      dedupeKey: input.dedupeKey,
      jobRequestId: input.jobRequestId,
      payload: { emailText: input.content.text, purpose: input.purpose, subject: input.content.subject },
      status: "PENDING",
      toEmail: input.toEmail,
      userId: input.userId,
    },
    update: {},
  }).catch((error) => {
    console.error("Unable to queue marketplace email", error);
    return null;
  });
  if (!delivery) return;
  if (delivery.status === "SENT") return;

  try {
    const result = await sendTransactionalEmail({
      idempotencyKey: input.dedupeKey,
      subject: input.content.subject,
      text: input.content.text,
      to: input.toEmail,
    });
    await markEmailDeliverySent({
      deliveryId: delivery.id,
      providerMessageId: result.providerMessageId,
    });
  } catch (error) {
    await markEmailDeliveryFailed({
      deliveryId: delivery.id,
      failureReason: error instanceof Error ? error.message : "Unable to send marketplace email.",
    });
  }
}

export async function retryPendingMarketplaceEmails(limit = 20) {
  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      channel: "EMAIL",
      status: { in: ["PENDING", "FAILED"] },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  let attempted = 0;
  for (const delivery of deliveries) {
    const payload = delivery.payload && typeof delivery.payload === "object" && !Array.isArray(delivery.payload)
      ? delivery.payload as Record<string, unknown>
      : null;
    const subject = typeof payload?.subject === "string" ? payload.subject : null;
    const text = typeof payload?.emailText === "string" ? payload.emailText : null;
    if (!delivery.toEmail || !delivery.dedupeKey || !subject || !text) continue;
    attempted += 1;
    try {
      const result = await sendTransactionalEmail({
        idempotencyKey: delivery.dedupeKey,
        subject,
        text,
        to: delivery.toEmail,
      });
      await markEmailDeliverySent({ deliveryId: delivery.id, providerMessageId: result.providerMessageId });
    } catch (error) {
      await markEmailDeliveryFailed({
        deliveryId: delivery.id,
        failureReason: error instanceof Error ? error.message : "Unable to send marketplace email.",
      });
    }
  }
  return attempted;
}
