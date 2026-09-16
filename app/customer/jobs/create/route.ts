import { JobRequestStatus, Prisma, PropertyType, UserRole } from "@prisma/client";
import { after, NextResponse } from "next/server";
import { parseJobRequestForm } from "@/lib/marketplace-form";
import { processJobOutreach } from "@/lib/outreach-worker";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { createJobReference } from "@/lib/providers";

function respondWithError(request: Request, message: string) {
  if (request.headers.get("X-Well-Kept-Client") === "1") {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.redirect(
    new URL(`/customer/jobs/new?error=${encodeURIComponent(message)}`, request.url),
    303,
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
  const clientRequestId = String(formData.get("clientRequestId") ?? "").trim();

  try {
    if (clientRequestId.length > 100) {
      return respondWithError(request, "Unable to post this request. Refresh and try again.");
    }

    if (clientRequestId) {
      const existingJob = await prisma.jobRequest.findUnique({
        where: {
          customerId_clientRequestId: {
            customerId: user.id,
            clientRequestId,
          },
        },
        select: { id: true },
      });

      if (existingJob) {
        return respondWithJob(request, existingJob.id);
      }
    }

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
              suppliesSource: input.suppliesSource,
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
          clientRequestId: clientRequestId || null,
          customerCompletedJobsSnapshot: priorCompletedJobs,
          customerMemberSinceSnapshot: user.createdAt,
          snapshotPropertyType: linkedHome?.propertyType ?? null,
          snapshotBedroomCount: linkedHome?.bedroomCount ?? null,
          snapshotBathroomCount: linkedHome?.bathroomCount ?? null,
          snapshotEstimatedSquareFeet: linkedHome?.estimatedSquareFeet ?? null,
          snapshotStoryCount: linkedHome?.storyCount ?? null,
          snapshotHasPets: linkedHome ? linkedHome.hasPets : null,
        },
      });
    });

    after(() => processJobOutreach(job.id));
    return respondWithJob(request, job.id);
  } catch (error) {
    if (
      clientRequestId &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingJob = await prisma.jobRequest.findUnique({
        where: {
          customerId_clientRequestId: {
            customerId: user.id,
            clientRequestId,
          },
        },
        select: { id: true },
      });
      if (existingJob) return respondWithJob(request, existingJob.id);
    }

    const message =
      error instanceof Error ? error.message : "Unable to post your job right now.";
    return respondWithError(request, message);
  }
}

function respondWithJob(request: Request, jobId: string) {
  if (request.headers.get("X-Well-Kept-Client") === "1") {
    return NextResponse.json({ jobId });
  }

  return NextResponse.redirect(new URL(`/customer/jobs/${jobId}?posted=1`, request.url), 303);
}
