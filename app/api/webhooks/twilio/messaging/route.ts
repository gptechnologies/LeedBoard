import {
  JobOutreachStatus,
  NotificationStatus,
  OutreachEventType,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizePhone } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function mapTwilioStatus(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return NotificationStatus.DELIVERED;
    case "failed":
    case "undelivered":
      return NotificationStatus.FAILED;
    case "sent":
    case "queued":
    case "sending":
    case "accepted":
      return NotificationStatus.SENT;
    default:
      return NotificationStatus.PENDING;
  }
}

function isOptOut(body: string) {
  return ["stop", "stopall", "unsubscribe", "cancel", "end", "quit"].includes(
    body.trim().toLowerCase(),
  );
}

function isOptIn(body: string) {
  return ["start", "unstop", "yes"].includes(body.trim().toLowerCase());
}

function isInterested(body: string) {
  const normalized = body.trim().toLowerCase();
  return ["yes", "interested", "send", "bid"].some((keyword) =>
    normalized.includes(keyword),
  );
}

function isNotInterested(body: string) {
  const normalized = body.trim().toLowerCase();
  return ["no", "not interested", "pass"].some((keyword) =>
    normalized.includes(keyword),
  );
}

export async function POST(request: Request) {
  if (process.env.ENABLE_SMS_OUTREACH !== "true") {
    return NextResponse.json({ disabled: true, received: false }, { status: 202 });
  }

  const formData = await request.formData();
  if (!isValidTwilioRequest(request, formData)) {
    return NextResponse.json({ error: "Invalid Twilio signature." }, { status: 401 });
  }
  const messageSid = String(formData.get("MessageSid") || formData.get("SmsSid") || "").trim();
  const messageStatus = String(
    formData.get("MessageStatus") || formData.get("SmsStatus") || "",
  ).trim();
  const fromRaw = String(formData.get("From") || "").trim();
  const body = String(formData.get("Body") || "").trim();

  if (messageSid && messageStatus) {
    await handleDeliveryStatus(messageSid, messageStatus);
  }

  if (fromRaw && body) {
    await handleInboundMessage(fromRaw, body);
  }

  return NextResponse.json({ received: true });
}

function isValidTwilioRequest(request: Request, formData: FormData) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const suppliedSignature = request.headers.get("x-twilio-signature");
  if (!authToken || !suppliedSignature) return false;

  const webhookUrl = process.env.TWILIO_MESSAGING_WEBHOOK_URL || request.url;
  const payload = Array.from(formData.entries())
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((value, [key, item]) => `${value}${key}${item}`, webhookUrl);
  const expectedSignature = createHmac("sha1", authToken).update(payload).digest("base64");
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

async function handleDeliveryStatus(messageSid: string, messageStatus: string) {
  const status = mapTwilioStatus(messageStatus);
  const delivery = await prisma.notificationDelivery.findFirst({
    where: { providerMessageId: messageSid },
    include: {
      jobOutreach: true,
    },
  });

  if (!delivery) {
    return;
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status,
        deliveredAt: status === NotificationStatus.DELIVERED ? now : delivery.deliveredAt,
        failureReason:
          status === NotificationStatus.FAILED ? `Twilio status: ${messageStatus}` : null,
      },
    });

    if (delivery.jobOutreachId) {
      await tx.jobOutreach.update({
        where: { id: delivery.jobOutreachId },
        data: {
          status:
            status === NotificationStatus.DELIVERED
              ? JobOutreachStatus.DELIVERED
              : status === NotificationStatus.FAILED
                ? JobOutreachStatus.FAILED
                : JobOutreachStatus.SENT,
          failureReason:
            status === NotificationStatus.FAILED ? `Twilio status: ${messageStatus}` : null,
        },
      });

      await tx.outreachEvent.create({
        data: {
          jobOutreachId: delivery.jobOutreachId,
          eventType:
            status === NotificationStatus.DELIVERED
              ? OutreachEventType.DELIVERED
              : status === NotificationStatus.FAILED
                ? OutreachEventType.FAILED
                : OutreachEventType.SENT,
          payload: {
            providerMessageId: messageSid,
            twilioStatus: messageStatus,
          },
        },
      });
    }
  });
}

async function handleInboundMessage(fromRaw: string, body: string) {
  let from: string;
  try {
    from = normalizePhone(fromRaw);
  } catch {
    from = fromRaw;
  }

  const lead = await prisma.cleanerLead.findUnique({
    where: { phone: from },
  });

  if (!lead) {
    return;
  }

  if (isOptOut(body)) {
    await prisma.cleanerLead.update({
      where: { id: lead.id },
      data: {
        optedOutAt: new Date(),
        optOutReason: "Twilio inbound STOP keyword",
      },
    });

    await prisma.jobOutreach.updateMany({
      where: {
        cleanerLeadId: lead.id,
        status: {
          notIn: [JobOutreachStatus.BID_SUBMITTED, JobOutreachStatus.NOT_INTERESTED],
        },
      },
      data: {
        status: JobOutreachStatus.OPTED_OUT,
      },
    });

    return;
  }

  if (isOptIn(body)) {
    await prisma.cleanerLead.update({
      where: { id: lead.id },
      data: {
        optedOutAt: null,
        optOutReason: null,
        consentedAt: new Date(),
      },
    });
  }

  const outreach = await prisma.jobOutreach.findFirst({
    where: {
      cleanerLeadId: lead.id,
      status: {
        in: [
          JobOutreachStatus.SENT,
          JobOutreachStatus.DELIVERED,
          JobOutreachStatus.PENDING,
          JobOutreachStatus.INVITE_SENT,
        ],
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!outreach) {
    return;
  }

  if (isInterested(body)) {
    await prisma.jobOutreach.update({
      where: { id: outreach.id },
      data: {
        status: JobOutreachStatus.INTERESTED,
      },
    });
    await prisma.outreachEvent.create({
      data: {
        jobOutreachId: outreach.id,
        eventType: OutreachEventType.INTERESTED,
        payload: { inboundBody: body },
      },
    });
  }

  if (isNotInterested(body)) {
    await prisma.jobOutreach.update({
      where: { id: outreach.id },
      data: {
        status: JobOutreachStatus.NOT_INTERESTED,
      },
    });
    await prisma.outreachEvent.create({
      data: {
        jobOutreachId: outreach.id,
        eventType: OutreachEventType.NOT_INTERESTED,
        payload: { inboundBody: body },
      },
    });
  }
}
