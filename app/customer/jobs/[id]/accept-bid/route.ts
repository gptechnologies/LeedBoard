import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getRequiredString } from "@/lib/auth";
import { notifyCleanerOfAcceptance } from "@/lib/marketplace-notifications";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

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

    const match = await prisma.$transaction(async (tx) => {
      const job = await tx.jobRequest.findFirst({
        where: {
          id,
          customerId: user.id,
          status: JobRequestStatus.OPEN,
        },
        include: {
          bids: true,
        },
      });

      if (!job) {
        throw new Error("This job is no longer open.");
      }

      const bid = job.bids.find((item) => item.id === bidId && item.status === BidStatus.SUBMITTED);

      if (!bid) {
        throw new Error("That bid is no longer available.");
      }

      const claimed = await tx.jobRequest.updateMany({
        where: {
          id: job.id,
          customerId: user.id,
          status: JobRequestStatus.OPEN,
        },
        data: {
          status: JobRequestStatus.AWARDED,
          acceptedBidId: bid.id,
          acceptedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        throw new Error("Another bid was already selected for this job.");
      }

      await tx.jobBid.update({
        where: { id: bid.id },
        data: { status: BidStatus.ACCEPTED },
      });

      await tx.jobBid.updateMany({
        where: {
          jobRequestId: job.id,
          id: { not: bid.id },
          status: BidStatus.SUBMITTED,
        },
        data: {
          status: BidStatus.DECLINED,
        },
      });

      return tx.jobRequest.findUniqueOrThrow({
        where: { id: job.id },
        include: {
          homeProfile: { select: { propertyType: true } },
          acceptedBid: { include: { cleaner: true } },
        },
      });
    });

    if (!match.acceptedBid) throw new Error("The selected bid could not be loaded.");

    await notifyCleanerOfAcceptance({
      bidId: match.acceptedBid.id,
      cleaner: match.acceptedBid.cleaner,
      job: match,
    });

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
