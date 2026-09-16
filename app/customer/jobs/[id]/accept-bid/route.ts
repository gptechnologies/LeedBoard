import { BidStatus, ConversationCloseReason, JobRequestStatus, UserRole } from "@prisma/client";
import { after, NextResponse } from "next/server";
import { getRequiredString } from "@/lib/auth";
import { getConnectionSummaryDeliveries, sendConnectionSummaryEmails } from "@/lib/marketplace-notifications";
import { prisma } from "@/lib/prisma";
import { normalizePhone, requireApiUser } from "@/lib/session";

function respondWithError(request: Request, jobId: string, message: string) {
  if (request.headers.get("X-Well-Kept-Client") === "1") {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.redirect(
    new URL(`/customer/jobs/${jobId}/bids?error=${encodeURIComponent(message)}`, request.url),
  );
}

type Params = Promise<{
  id: string;
}>;

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const formData = await request.formData();
  try {
    const bidId = getRequiredString(formData.get("bidId"), "Bid");
    const homeownerPhone = user.phone || normalizePhone(getRequiredString(formData.get("phone"), "Mobile number"));

    const match = await prisma.$transaction(async (tx) => {
      const job = await tx.jobRequest.findFirst({
        where: {
          id,
          customerId: user.id,
          status: JobRequestStatus.OPEN,
        },
        include: {
          bids: { include: { cleaner: true, cleanerLead: true } },
        },
      });

      if (!job) {
        throw new Error("This job is no longer open.");
      }

      const bid = job.bids.find((item) => item.id === bidId && item.status === BidStatus.SUBMITTED);

      if (!bid) {
        throw new Error("That bid is no longer available.");
      }

      const providerPhone = bid.cleanerLead?.phone || bid.cleaner?.phone;
      const providerEmail = bid.cleanerLead?.email || bid.cleaner?.email;
      if (!providerPhone || !providerEmail) {
        throw new Error("This provider is missing contact details. Please choose another bid or contact support.");
      }

      if (!user.phone) {
        await tx.user.update({ where: { id: user.id }, data: { phone: homeownerPhone } });
      }

      const acceptedAt = new Date();

      const claimed = await tx.jobRequest.updateMany({
        where: {
          id: job.id,
          customerId: user.id,
          status: JobRequestStatus.OPEN,
        },
        data: {
          status: JobRequestStatus.AWARDED,
          acceptedBidId: bid.id,
          acceptedAt,
        },
      });

      if (claimed.count !== 1) {
        throw new Error("Another bid was already selected for this job.");
      }

      await tx.jobBid.update({
        where: { id: bid.id },
        data: {
          status: BidStatus.ACCEPTED,
          conversationClosedAt: acceptedAt,
          conversationCloseReason: ConversationCloseReason.ACCEPTED,
        },
      });

      await tx.jobBid.updateMany({
        where: {
          jobRequestId: job.id,
          id: { not: bid.id },
          status: BidStatus.SUBMITTED,
        },
        data: {
          status: BidStatus.DECLINED,
          conversationClosedAt: acceptedAt,
          conversationCloseReason: ConversationCloseReason.NOT_SELECTED,
        },
      });

      const match = await tx.jobRequest.findUniqueOrThrow({
        where: { id: job.id },
        include: {
          homeProfile: { select: { propertyType: true } },
          customer: true,
          acceptedBid: {
            include: {
              cleaner: true,
              cleanerLead: true,
              messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
            },
          },
        },
      });
      if (!match.acceptedBid) throw new Error("The selected bid could not be loaded.");
      const deliveries = getConnectionSummaryDeliveries({
        bid: match.acceptedBid,
        customer: match.customer,
        job: match,
      });
      for (const delivery of deliveries) {
        await tx.notificationDelivery.upsert({
          where: { dedupeKey: delivery.dedupeKey },
          update: {},
          create: {
            channel: "EMAIL",
            dedupeKey: delivery.dedupeKey,
            jobRequestId: delivery.jobRequestId,
            payload: {
              emailText: delivery.content.text,
              purpose: delivery.purpose,
              subject: delivery.content.subject,
            },
            status: "PENDING",
            toEmail: delivery.toEmail,
            userId: delivery.userId,
          },
        });
      }
      return match;
    });

    if (!match.acceptedBid) throw new Error("The selected bid could not be loaded.");

    after(() => sendConnectionSummaryEmails({
      bid: match.acceptedBid!,
      customer: match.customer,
      job: match,
    }));

    if (request.headers.get("X-Well-Kept-Client") === "1") {
      return NextResponse.json({ bidId: match.acceptedBid.id });
    }

    return NextResponse.redirect(new URL(`/customer/messages/${match.acceptedBid.id}`, request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to accept that bid right now.";
    return respondWithError(request, id, message);
  }
}
