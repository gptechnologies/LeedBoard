import { OutreachChannel, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCleanerInviteSms } from "@/lib/sms";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{
  id: string;
}>;

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.ADMIN);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const outreach = await prisma.jobOutreach.findUnique({
    where: { id },
    select: {
      channel: true,
      cleanerLeadId: true,
    },
  });

  if (outreach?.channel === OutreachChannel.SMS && outreach.cleanerLeadId) {
    await sendCleanerInviteSms(id);
  }

  return NextResponse.redirect(new URL("/admin/outreach", request.url));
}
