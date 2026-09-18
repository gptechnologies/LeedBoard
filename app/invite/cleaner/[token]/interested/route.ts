import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { isOutreachExpired, markOutreachInterested } from "@/lib/outreach";
import { prisma } from "@/lib/prisma";
import { expireJobIfDue } from "@/lib/job-lifecycle";
import { JobRequestStatus } from "@prisma/client";

type Params = Promise<{
  token: string;
}>;

export async function POST(request: Request, { params }: { params: Params }) {
  const { token } = await params;
  const outreach = await prisma.jobOutreach.findUnique({
    where: { interestToken: token },
    select: {
      id: true,
      jobRequestId: true,
      interestTokenExpiresAt: true,
    },
  });

  if (!outreach || isOutreachExpired(outreach)) {
    return NextResponse.redirect(new URL(`/invite/cleaner/${token}`, request.url));
  }
  const job = await expireJobIfDue(outreach.jobRequestId);
  if (job?.status !== JobRequestStatus.OPEN) return NextResponse.redirect(new URL(`/invite/cleaner/${token}`, request.url));

  await markOutreachInterested(outreach.id);

  return NextResponse.redirect(
    new URL(`/signup?role=${UserRole.CLEANER}&inviteToken=${encodeURIComponent(token)}`, request.url),
  );
}
