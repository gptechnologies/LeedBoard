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
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) return user;

  const { id } = await context.params;
  const result = await prisma.jobRequest.updateMany({
    where: {
      id,
      customerId: user.id,
      status: JobRequestStatus.OPEN,
    },
    data: {
      status: JobRequestStatus.CANCELLED,
    },
  });

  if (result.count === 0) {
    return redirectWithError(request, id, "Only an open job can be cancelled.");
  }

  return NextResponse.redirect(new URL("/customer/jobs?cancelled=1", request.url));
}
