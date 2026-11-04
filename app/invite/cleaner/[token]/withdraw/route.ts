import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function POST(
  r: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const o = await prisma.jobOutreach.findUnique({
    where: { interestToken: token },
  });
  if (o && o.interestTokenExpiresAt > new Date() && o.bidId)
    await prisma.jobBid.updateMany({
      where: {
        id: o.bidId,
        status: "SUBMITTED",
        jobRequest: { status: "OPEN" },
      },
      data: { status: "WITHDRAWN" },
    });
  return NextResponse.redirect(
    new URL(`/invite/cleaner/${token}?edit=1`, r.url),
    303,
  );
}
