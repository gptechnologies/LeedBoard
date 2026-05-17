import { BidStatus, JobRequestStatus, ThreadMessageKind, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getRequiredString } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

function redirectWithError(request: Request, jobId: string, message: string) {
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
  let acceptedBidId: string | null = null;

  try {
    const bidId = getRequiredString(formData.get("bidId"), "Bid");

    await prisma.$transaction(async (tx) => {
      const bid = await tx.jobBid.findFirst({
        where: {
          status: BidStatus.SUBMITTED,
          id: bidId,
          jobRequest: {
            is: {
              id,
              customerId: user.id,
              status: JobRequestStatus.OPEN,
            },
          },
        },
        select: {
          id: true,
          jobRequestId: true,
        },
      });

      if (!bid) {
        throw new Error("That bid is no longer available.");
      }

      const award = await tx.jobRequest.updateMany({
        where: {
          id,
          customerId: user.id,
          status: JobRequestStatus.OPEN,
          acceptedBidId: null,
        },
        data: {
          status: JobRequestStatus.AWARDED,
          acceptedBidId: bid.id,
        },
      });

      if (award.count !== 1) {
        throw new Error("This job is no longer open.");
      }

      const accepted = await tx.jobBid.updateMany({
        where: {
          id: bid.id,
          status: BidStatus.SUBMITTED,
        },
        data: {
          status: BidStatus.ACCEPTED,
        },
      });

      if (accepted.count !== 1) {
        throw new Error("That bid is no longer available.");
      }

      await tx.jobBid.updateMany({
        where: {
          jobRequestId: bid.jobRequestId,
          id: { not: bid.id },
          status: BidStatus.SUBMITTED,
        },
        data: {
          status: BidStatus.DECLINED,
        },
      });

      const thread = await tx.messageThread.upsert({
        where: {
          jobBidId: bid.id,
        },
        update: {},
        create: {
          jobBidId: bid.id,
          createdById: user.id,
        },
        select: {
          id: true,
        },
      });

      const existingAcceptanceMessage = await tx.threadMessage.findFirst({
        where: {
          threadId: thread.id,
          kind: ThreadMessageKind.BID_ACCEPTED,
        },
        select: {
          id: true,
        },
      });

      if (!existingAcceptanceMessage) {
        await tx.threadMessage.create({
          data: {
            threadId: thread.id,
            senderId: user.id,
            kind: ThreadMessageKind.BID_ACCEPTED,
            body: "Looking forward to seeing you then.",
          },
        });
      }

      acceptedBidId = bid.id;
    });

    return NextResponse.redirect(new URL(`/customer/messages/${acceptedBidId ?? id}`, request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to accept that bid right now.";
    return redirectWithError(request, id, message);
  }
}
