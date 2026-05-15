import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { isOutreachExpired, markOutreachInterested } from "@/lib/outreach";
import { prisma } from "@/lib/prisma";

type Params = Promise<{
  token: string;
}>;

export async function POST(request: Request, { params }: { params: Params }) {
  const { token } = await params;
  const outreach = await prisma.jobOutreach.findUnique({
    where: { interestToken: token },
    select: {
      id: true,
      interestTokenExpiresAt: true,
    },
  });

  if (!outreach || isOutreachExpired(outreach)) {
    return NextResponse.redirect(new URL(`/invite/cleaner/${token}`, request.url));
  }

  await markOutreachInterested(outreach.id);

  return NextResponse.redirect(
    new URL(`/signup?role=${UserRole.CLEANER}&inviteToken=${encodeURIComponent(token)}`, request.url),
  );
}
