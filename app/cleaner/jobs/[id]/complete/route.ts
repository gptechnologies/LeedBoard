import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyHomeownerOfCompletion } from "@/lib/marketplace-notifications";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{
  id: string;
}>;

function redirectWithError(request: Request, bidId: string | null, message: string) {
  if (request.headers.get("X-Well-Kept-Client") === "1") {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const path = bidId ? `/cleaner/messages/${bidId}` : "/cleaner";
  return NextResponse.redirect(new URL(`${path}?error=${encodeURIComponent(message)}`, request.url));
}

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.CLEANER);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;

  try {
    const bid = await prisma.jobBid.findFirst({
      where: {
        cleanerId: user.id,
        jobRequestId: id,
        status: BidStatus.ACCEPTED,
      },
      include: {
        jobRequest: {
          include: {
            customer: true,
            homeProfile: { select: { propertyType: true } },
          },
        },
      },
    });

    if (!bid) {
      return redirectWithError(request, null, "Only the accepted cleaner can complete this job.");
    }

    if (bid.jobRequest.status === JobRequestStatus.COMPLETED) {
      if (request.headers.get("X-Well-Kept-Client") === "1") {
        return NextResponse.json({ ok: true });
      }
      return NextResponse.redirect(new URL(`/cleaner/messages/${bid.id}`, request.url));
    }

    if (bid.jobRequest.status !== JobRequestStatus.AWARDED) {
      return redirectWithError(request, bid.id, "This job is not ready to be completed.");
    }

    const completed = await prisma.jobRequest.updateMany({
      where: {
        id: bid.jobRequestId,
        status: JobRequestStatus.AWARDED,
        acceptedBidId: bid.id,
      },
      data: {
        status: JobRequestStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    if (completed.count !== 1) {
      return redirectWithError(request, bid.id, "This job changed before it could be completed. Refresh and try again.");
    }

    await notifyHomeownerOfCompletion({
      bidId: bid.id,
      customer: bid.jobRequest.customer,
      job: bid.jobRequest,
    });

    if (request.headers.get("X-Well-Kept-Client") === "1") {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.redirect(new URL(`/cleaner/messages/${bid.id}?completed=1`, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to complete this job.";
    return redirectWithError(request, null, message);
  }
}
