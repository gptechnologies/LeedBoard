import { JobRequestStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseJobRequestForm } from "@/lib/marketplace-form";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/customer/jobs/new?error=${encodeURIComponent(message)}`, request.url),
  );
}

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const formData = await request.formData();

  try {
    const input = parseJobRequestForm(formData);
    const [homeProfile, priorCompletedJobs] = await Promise.all([
      input.homeProfileId
        ? prisma.homeProfile.findFirst({
            where: {
              id: input.homeProfileId,
              customerId: user.id,
            },
          })
        : Promise.resolve(null),
      prisma.jobRequest.count({
        where: {
          customerId: user.id,
          status: JobRequestStatus.AWARDED,
        },
      }),
    ]);

    if (input.homeProfileId && !homeProfile) {
      return redirectWithError(request, "That home preset is no longer available.");
    }

    const job = await prisma.jobRequest.create({
      data: {
        ...input,
        status: JobRequestStatus.OPEN,
        customerId: user.id,
        homeProfileId: homeProfile?.id ?? null,
        customerCompletedJobsSnapshot: priorCompletedJobs,
        customerMemberSinceSnapshot: user.createdAt,
      },
    });

    return NextResponse.redirect(new URL(`/customer/jobs/${job.id}/bids`, request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to post your job right now.";
    return redirectWithError(request, message);
  }
}
