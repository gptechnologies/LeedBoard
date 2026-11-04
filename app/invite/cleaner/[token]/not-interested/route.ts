import { NextResponse } from "next/server";
import { isOutreachExpired, markOutreachNotInterested } from "@/lib/outreach";
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
      bidId: true,
    },
  });

  if (outreach && !isOutreachExpired(outreach)) {
    await markOutreachNotInterested(outreach.id);
    if (outreach.bidId)
      await prisma.jobBid.updateMany({
        where: {
          id: outreach.bidId,
          status: "SUBMITTED",
          jobRequest: { status: "OPEN" },
        },
        data: { status: "WITHDRAWN" },
      });
  }

  return NextResponse.redirect(
    new URL(`/invite/cleaner/${token}`, request.url),
  );
}
