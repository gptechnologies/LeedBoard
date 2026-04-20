import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseBidForm } from "@/lib/marketplace-form";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

function redirectWithError(request: Request, jobId: string, message: string) {
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
    const job = await prisma.jobRequest.findFirst({
      where: {
        id,
        status: JobRequestStatus.OPEN,
      },
    });

    if (!job) {
      return redirectWithError(request, id, "That job is no longer accepting bids.");
    }

    if (!user.cleanerProfile?.isAvailable) {
      return redirectWithError(request, id, "Pause removed. Set your availability first.");
    }

    const input = parseBidForm(formData, job.timingPreference === "ASAP");

    await prisma.jobBid.upsert({
      where: {
        jobRequestId_cleanerId: {
          jobRequestId: job.id,
          cleanerId: user.id,
        },
      },
      update: {
        ...input,
        status: BidStatus.SUBMITTED,
      },
      create: {
        ...input,
        status: BidStatus.SUBMITTED,
        jobRequestId: job.id,
        cleanerId: user.id,
      },
    });

    return NextResponse.redirect(new URL("/cleaner?success=1", request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit your bid right now.";
    return redirectWithError(request, id, message);
  }
}
