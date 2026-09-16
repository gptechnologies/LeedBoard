import { BidStatus, ConversationChannel, ConversationDeliveryStatus, ConversationSender, JobRequestStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getConversationReference, getProviderPhone, resolveConversationReference } from "@/lib/providers";
import { normalizePhone } from "@/lib/session";
import { isConversationSmsReady, sendConversationSms } from "@/lib/sms";

export type ThreadMessage = {
  id: string;
  sender: ConversationSender;
  channel: ConversationChannel;
  body: string;
  deliveryStatus: ConversationDeliveryStatus | null;
  createdAt: string;
};

export function toThreadMessage(message: {
  id: string;
  sender: ConversationSender;
  channel: ConversationChannel;
  body: string;
  deliveryStatus: ConversationDeliveryStatus | null;
  createdAt: Date;
}): ThreadMessage {
  return { ...message, createdAt: message.createdAt.toISOString() };
}

export function initialBidMessage(bid: { id: string; message: string | null; createdAt: Date }): ThreadMessage[] {
  return bid.message?.trim() ? [{
    id: `bid-${bid.id}`,
    sender: ConversationSender.CLEANER,
    channel: ConversationChannel.APP,
    body: bid.message.trim(),
    deliveryStatus: null,
    createdAt: bid.createdAt.toISOString(),
  }] : [];
}

export async function sendAppMessage(input: { bidId: string; body: string; role: UserRole; userId: string }) {
  const bid = await prisma.jobBid.findFirst({
    where: input.role === UserRole.CUSTOMER
      ? { id: input.bidId, jobRequest: { customerId: input.userId } }
      : { id: input.bidId, OR: [{ cleanerId: input.userId }, { cleanerLead: { linkedCleanerUserId: input.userId } }] },
    include: { cleanerLead: true, cleaner: true, jobRequest: true },
  });
  if (!bid) return { error: "Conversation not found.", status: 404 } as const;
  if (bid.conversationClosedAt || bid.status === BidStatus.ACCEPTED || bid.status === BidStatus.DECLINED || bid.status === BidStatus.WITHDRAWN ||
    bid.jobRequest.status === JobRequestStatus.CANCELLED || bid.jobRequest.status === JobRequestStatus.EXPIRED) {
    return { error: "This conversation is closed.", status: 400 } as const;
  }

  const smsOnly = input.role === UserRole.CUSTOMER && !bid.cleanerId && !bid.cleanerLead?.linkedCleanerUserId && Boolean(bid.cleanerLeadId);
  const phone = smsOnly ? getProviderPhone(bid) : null;
  if (smsOnly && (bid.cleanerLead?.optedOutAt || !phone || !isConversationSmsReady())) {
    return { error: "SMS is not available for this cleaner yet.", status: 503 } as const;
  }

  const sender = input.role === UserRole.CUSTOMER ? ConversationSender.CUSTOMER : ConversationSender.CLEANER;
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.conversationMessage.create({
      data: {
        bidId: bid.id,
        sender,
        channel: ConversationChannel.APP,
        body: input.body,
        deliveryStatus: smsOnly ? ConversationDeliveryStatus.PENDING : null,
      },
    });
    await tx.jobBid.update({
      where: { id: bid.id },
      data: input.role === UserRole.CUSTOMER ? { cleanerViewedAt: null } : { customerViewedAt: null },
    });
    return created;
  });

  if (smsOnly && phone) {
    try {
      const sid = await sendConversationSms(phone, `Well Kept ${getConversationReference(bid)}: ${input.body}`);
      const sent = await prisma.conversationMessage.update({
        where: { id: message.id },
        data: { providerMessageId: sid, deliveryStatus: ConversationDeliveryStatus.SENT },
      });
      return { message: toThreadMessage(sent) } as const;
    } catch {
      const failed = await prisma.conversationMessage.update({
        where: { id: message.id }, data: { deliveryStatus: ConversationDeliveryStatus.FAILED },
      });
      return { message: toThreadMessage(failed), error: "Text could not be sent. Try again.", status: 502 } as const;
    }
  }
  return { message: toThreadMessage(message) } as const;
}

export async function receiveConversationSms(input: { body: string; from: string; to: string; sid: string }) {
  if (!isConversationSmsReady()) return { matched: false } as const;
  let from: string;
  let to: string;
  try {
    from = normalizePhone(input.from);
    to = normalizePhone(input.to);
    if (to !== normalizePhone(process.env.TWILIO_FROM_PHONE_NUMBER!)) return { matched: false } as const;
  } catch {
    return { matched: false } as const;
  }

  const existing = await prisma.conversationMessage.findUnique({ where: { providerMessageId: input.sid } });
  if (existing) return { matched: true } as const;

  const bids = await prisma.jobBid.findMany({
    where: {
      status: BidStatus.SUBMITTED,
      conversationClosedAt: null,
      jobRequest: { status: { in: [JobRequestStatus.OPEN, JobRequestStatus.AWARDED] } },
      OR: [
        { cleanerLead: { phone: from } },
        { cleaner: { phone: from } },
        { jobRequest: { customer: { phone: from } } },
      ],
    },
    include: { cleanerLead: true, cleaner: true, jobRequest: { include: { customer: true } } },
  });
  if (!bids.length) return { matched: false } as const;

  const resolved = resolveConversationReference(bids, input.body);
  if (resolved.matches.length !== 1) return { matched: true, ambiguous: true } as const;
  const bid = resolved.matches[0];
  const fromCleaner = [bid.cleanerLead?.phone, bid.cleaner?.phone].some((phone) => phone && normalizePhone(phone) === from);
  const fromCustomer = bid.jobRequest.customer.phone && normalizePhone(bid.jobRequest.customer.phone) === from;
  if (Boolean(fromCleaner) === Boolean(fromCustomer)) return { matched: true, ambiguous: true } as const;

  const sender = fromCleaner ? ConversationSender.CLEANER : ConversationSender.CUSTOMER;
  const body = resolved.messageBody;
  if (!body) return { matched: true } as const;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.conversationMessage.create({
        data: { bidId: bid.id, sender, channel: ConversationChannel.SMS, body, providerMessageId: input.sid },
      });
      await tx.jobBid.update({ where: { id: bid.id }, data: fromCleaner ? { customerViewedAt: null } : { cleanerViewedAt: null } });
    });
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    return { matched: true } as const;
  }

  if (fromCustomer && !bid.cleanerId && !bid.cleanerLead?.linkedCleanerUserId && bid.cleanerLead?.phone && !bid.cleanerLead.optedOutAt) {
    const reply = await prisma.conversationMessage.findUnique({ where: { providerMessageId: input.sid } });
    if (reply) {
      const delivery = await prisma.notificationDelivery.create({
        data: { channel: "SMS", status: "PENDING", toPhone: bid.cleanerLead.phone, jobRequestId: bid.jobRequestId, cleanerLeadId: bid.cleanerLeadId, payload: { conversationMessageId: reply.id } },
      });
      try {
        const sid = await sendConversationSms(bid.cleanerLead.phone, `Well Kept ${getConversationReference(bid)}: ${body}`);
        await prisma.conversationMessage.update({ where: { id: reply.id }, data: { deliveryStatus: ConversationDeliveryStatus.SENT } });
        // The inbound SID remains the idempotency key; the relay SID is tracked in the delivery log.
        await prisma.notificationDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", providerMessageId: sid, sentAt: new Date() } });
      } catch {
        await prisma.conversationMessage.update({ where: { id: reply.id }, data: { deliveryStatus: ConversationDeliveryStatus.FAILED } });
        await prisma.notificationDelivery.update({ where: { id: delivery.id }, data: { status: "FAILED", failureReason: "Conversation text could not be relayed." } });
      }
    }
  }
  return { matched: true } as const;
}
