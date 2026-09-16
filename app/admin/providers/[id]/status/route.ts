import { ProviderApprovalStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.ADMIN);
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const formData = await request.formData();
  const value = String(formData.get("status") || "");
  const allowedStatuses: ProviderApprovalStatus[] = [
    ProviderApprovalStatus.APPROVED,
    ProviderApprovalStatus.PAUSED,
    ProviderApprovalStatus.BLOCKED,
  ];
  if (!allowedStatuses.includes(value as ProviderApprovalStatus)) {
    return NextResponse.redirect(new URL("/admin/providers", request.url), 303);
  }
  const profile = await prisma.cleanerProfile.findUnique({ where: { id }, include: { user: true } });
  if (!profile) return NextResponse.redirect(new URL("/admin/providers", request.url), 303);
  if (
    value === ProviderApprovalStatus.APPROVED &&
    (!profile.user.phone || profile.serviceAreaPostalCodes.length === 0 || profile.serviceNeeds.length === 0)
  ) {
    const message = "Provider must add a mobile number, service ZIP, and services before approval.";
    return NextResponse.redirect(new URL(`/admin/providers?error=${encodeURIComponent(message)}`, request.url), 303);
  }
  await prisma.cleanerProfile.update({
    where: { id },
    data: {
      approvalStatus: value as ProviderApprovalStatus,
      isAvailable: value === ProviderApprovalStatus.APPROVED,
    },
  });
  return NextResponse.redirect(new URL("/admin/providers", request.url), 303);
}
