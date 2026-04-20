import { JobRequestStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

function redirectWithError(request: Request, jobId: string, message: string) {
  return NextResponse.redirect(
    new URL(`/customer/jobs/${jobId}?error=${encodeURIComponent(message)}`, request.url),
  );
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await context.params;
  const job = await prisma.jobRequest.findFirst({
    where: {
      id,
      customerId: user.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!job) {
    return redirectWithError(request, id, "That job could not be found.");
  }

  if (job.status !== JobRequestStatus.OPEN) {
    return redirectWithError(request, id, "Only open jobs can be deleted.");
  }

  await prisma.$transaction([
    prisma.jobBid.deleteMany({
      where: {
        jobRequestId: job.id,
      },
    }),
    prisma.jobRequest.delete({
      where: {
        id: job.id,
      },
    }),
  ]);

  return NextResponse.redirect(new URL("/customer", request.url));
}
