import { Prisma, type User } from "@prisma/client";

import {
  buildAppUrl,
  buildCleanerBidAcceptedEmail,
  buildHomeownerBidReceivedEmail,
  buildJobCompletedEmail,
  createEmailDelivery,
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
  cleaner: Pick<User, "firstName" | "lastName">;
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
    cleanerName: `${input.cleaner.firstName} ${input.cleaner.lastName}`.trim() || "A cleaner",
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
  cleaner: Pick<User, "email" | "id">;
  job: Parameters<typeof formatTimingSummary>[0] & {
    id: string;
    title: string;
    homeProfile?: { propertyType: "HOUSE" | "APARTMENT" } | null;
  };
}) {
  if (!input.cleaner.email) return;
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

async function sendMarketplaceEmail(input: {
  content: { subject: string; text: string };
  dedupeKey: string;
  jobRequestId: string;
  purpose: string;
  toEmail: string;
  userId: string;
}) {
  let delivery;

  try {
    delivery = await createEmailDelivery({
      dedupeKey: input.dedupeKey,
      jobRequestId: input.jobRequestId,
      payload: { purpose: input.purpose, subject: input.content.subject },
      toEmail: input.toEmail,
      userId: input.userId,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    console.error("Unable to create marketplace email delivery", error);
    return;
  }

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
