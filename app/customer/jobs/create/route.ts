import { JobRequestStatus, PropertyType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseJobRequestForm } from "@/lib/marketplace-form";
import { createJobOutreachForJob } from "@/lib/outreach";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { createJobReference } from "@/lib/providers";

function respondWithError(request: Request, message: string) {
  if (request.headers.get("X-Well-Kept-Client") === "1") {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.redirect(
    new URL(`/customer/jobs/new?error=${encodeURIComponent(message)}`, request.url),
  );
}

function getCleaningTitle(propertyType?: PropertyType | null) {
  return propertyType === PropertyType.APARTMENT ? "Apartment Cleaning" : "Home Cleaning";
}

function getJobTitle(inputTitle: string, propertyType?: PropertyType | null) {
  return inputTitle === "Home Cleaning" ? getCleaningTitle(propertyType) : inputTitle;
}

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const formData = await request.formData();

  try {
    const input = parseJobRequestForm(formData);
    const saveHome = formData.get("saveHome") === "true";
    const homeProfile = input.homeProfileId
      ? await prisma.homeProfile.findFirst({
          where: {
            id: input.homeProfileId,
            customerId: user.id,
          },
        })
      : null;

    if (input.homeProfileId && !homeProfile) {
      return respondWithError(request, "That saved home is no longer available. Choose another home and try again.");
    }

    const job = await prisma.$transaction(async (tx) => {
      const priorCompletedJobs = await tx.jobRequest.count({
        where: {
          customerId: user.id,
          status: JobRequestStatus.COMPLETED,
        },
      });
      const savedHome = !homeProfile && saveHome
        ? await tx.homeProfile.create({
            data: {
              label: "My Home",
              addressLine1: input.addressLine1,
              addressLine2: input.addressLine2,
              city: input.city,
              state: input.state,
              postalCode: input.postalCode,
              entryMethod: input.entryMethod,
              entryNotes: input.entryNotes,
              customerId: user.id,
              isDefault: true,
            },
          })
        : null;
      const linkedHome = homeProfile ?? savedHome;

      return tx.jobRequest.create({
        data: {
          ...input,
          publicReference: createJobReference(),
          title: getJobTitle(input.title, linkedHome?.propertyType),
          status: JobRequestStatus.OPEN,
          customerId: user.id,
          homeProfileId: linkedHome?.id ?? null,
          customerCompletedJobsSnapshot: priorCompletedJobs,
          customerMemberSinceSnapshot: user.createdAt,
        },
      });
    });

    await createJobOutreachForJob({
      city: job.city,
      jobRequestId: job.id,
      postalCode: job.postalCode,
      serviceNeeds: job.serviceNeeds,
      state: job.state,
    });

    if (request.headers.get("X-Well-Kept-Client") === "1") {
      return NextResponse.json({ jobId: job.id });
    }

    return NextResponse.redirect(new URL(`/customer/jobs/${job.id}/priority`, request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to post your job right now.";
    return respondWithError(request, message);
  }
}
