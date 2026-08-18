import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseBidForm } from "@/lib/marketplace-form";
import { notifyHomeownerOfBid } from "@/lib/marketplace-notifications";
import { attributeBidToOutreach } from "@/lib/outreach";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

function redirectWithError(request: Request, jobId: string, message: string) {
  if (request.headers.get("X-Well-Kept-Client") === "1") {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.redirect(
    new URL(`/cleaner/jobs/${jobId}?error=${encodeURIComponent(message)}`, request.url),
  );
}

type Params = Promise<{
  id: string;
}>;

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.CLEANER);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const formData = await request.formData();

  try {
    if (!user.cleanerProfile?.isAvailable) {
      return redirectWithError(request, id, "Pause removed. Set your availability first.");
    }

    const bid = await prisma.$transaction(async (tx) => {
      const job = await tx.jobRequest.findFirst({
        where: {
          id,
          status: JobRequestStatus.OPEN,
        },
      });

      if (!job) {
        throw new Error("That job is no longer accepting bids.");
      }

      const input = parseBidForm(formData, job.timingPreference === "ASAP");

      await tx.cleanerJobPass.deleteMany({
        where: {
          cleanerId: user.id,
          jobRequestId: job.id,
        },
      });

      return tx.jobBid.upsert({
        where: {
          jobRequestId_cleanerId: {
            jobRequestId: job.id,
            cleanerId: user.id,
          },
        },
        update: {
          ...input,
          status: BidStatus.SUBMITTED,
          customerViewedAt: null,
        },
        create: {
          ...input,
          status: BidStatus.SUBMITTED,
          jobRequestId: job.id,
          cleanerId: user.id,
        },
        include: {
          cleaner: true,
          jobRequest: {
            include: {
              customer: true,
              homeProfile: { select: { propertyType: true } },
            },
          },
        },
      });
    });

    await attributeBidToOutreach({
      jobRequestId: bid.jobRequestId,
      cleanerId: user.id,
      bidId: bid.id,
    });

    await notifyHomeownerOfBid({
      bid,
      cleaner: bid.cleaner,
      job: bid.jobRequest,
    });

    if (request.headers.get("X-Well-Kept-Client") === "1") {
      return NextResponse.json({ bidId: bid.id });
    }

    return NextResponse.redirect(new URL(`/cleaner/messages/${bid.id}`, request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit your bid right now.";
    return redirectWithError(request, id, message);
  }
}
