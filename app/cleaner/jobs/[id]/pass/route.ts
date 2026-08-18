import { JobRequestStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.CLEANER);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const job = await prisma.jobRequest.findFirst({
    where: {
      id,
      status: JobRequestStatus.OPEN,
      bids: { none: { cleanerId: user.id } },
    },
    select: { id: true },
  });

  if (!job) {
    return NextResponse.json(
      { error: "This job is no longer available to pass." },
      { status: 409 },
    );
  }

  await prisma.cleanerJobPass.upsert({
    where: {
      cleanerId_jobRequestId: {
        cleanerId: user.id,
        jobRequestId: job.id,
      },
    },
    update: { passedAt: new Date() },
    create: {
      cleanerId: user.id,
      jobRequestId: job.id,
    },
  });

  return NextResponse.json({ ok: true });
}
