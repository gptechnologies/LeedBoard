import { JobOutreachStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  markOutreachInterested,
  markOutreachNotInterested,
} from "@/lib/outreach";
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
  const formData = await request.formData();
  const status = String(formData.get("status") || "").trim();

  if (status === JobOutreachStatus.INTERESTED) {
    await markOutreachInterested(id);
  }

  if (status === JobOutreachStatus.NOT_INTERESTED) {
    await markOutreachNotInterested(id);
  }

  return NextResponse.redirect(new URL("/admin/outreach", request.url));
}
