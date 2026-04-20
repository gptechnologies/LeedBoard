import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
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

  try {
    const bidId = getRequiredString(formData.get("bidId"), "Bid");

    await prisma.$transaction(async (tx) => {
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

      await tx.jobRequest.update({
        where: { id: job.id },
        data: {
          status: JobRequestStatus.AWARDED,
          acceptedBidId: bid.id,
        },
      });
    });

    return NextResponse.redirect(new URL(`/customer/jobs/${id}`, request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to accept that bid right now.";
    return redirectWithError(request, id, message);
  }
}
