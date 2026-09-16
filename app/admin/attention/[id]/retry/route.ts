import { OutreachState, UserRole } from "@prisma/client";
import { after, NextResponse } from "next/server";

import { processJobOutreach } from "@/lib/outreach-worker";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.ADMIN);
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  await prisma.jobRequest.update({
    where: { id },
    data: {
      attentionReason: null,
      needsAttentionAt: null,
      outreachFailureReason: null,
      outreachNextAttemptAt: new Date(),
      outreachState: OutreachState.PENDING,
    },
  });
  after(() => processJobOutreach(id));
  return NextResponse.redirect(new URL("/admin/attention", request.url), 303);
}
