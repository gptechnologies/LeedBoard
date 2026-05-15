import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequiredString } from "@/lib/auth";
import { getRoleHome, requireSignedInIdentity } from "@/lib/session";

function toError(request: Request, message: string, role?: string, inviteToken?: string) {
  const search = new URLSearchParams({
    error: message,
  });

  if (role) {
    search.set("role", role);
  }

  if (inviteToken) {
    search.set("inviteToken", inviteToken);
  }

  return NextResponse.redirect(new URL(`/welcome?${search.toString()}`, request.url));
}

export async function POST(request: Request) {
  const identity = await requireSignedInIdentity();
  const formData = await request.formData();
  const inviteToken = String(formData.get("inviteToken") || "").trim();
  const roleValue = getRequiredString(formData.get("role"), "Role");
  const role =
    roleValue === UserRole.CLEANER
      ? UserRole.CLEANER
      : roleValue === UserRole.CUSTOMER
        ? UserRole.CUSTOMER
        : null;

  if (!role) {
    return toError(request, "Please choose a valid account type.", undefined, inviteToken);
  }

  try {
    const firstName = getRequiredString(formData.get("firstName"), "First name");
    const lastName = getRequiredString(formData.get("lastName"), "Last name");
    const email = String(formData.get("email") || "").trim().toLowerCase() || null;
    const businessName = String(formData.get("businessName") || "").trim() || null;
    const website = String(formData.get("website") || "").trim() || null;
    const bio = String(formData.get("bio") || "").trim() || null;
    const user = await prisma.user.update({
      where: { id: identity.userId },
      data: {
        role,
        firstName,
        lastName,
        email,
      },
    });

    if (role === UserRole.CLEANER) {
      await prisma.cleanerProfile.upsert({
        where: { userId: user.id },
        update: {
          bio,
          businessName,
          website,
          isAvailable: true,
          serviceAreaPostalCodes: [],
          serviceNeeds: [],
        },
        create: {
          userId: user.id,
          bio,
          businessName,
          website,
          isAvailable: true,
          serviceAreaPostalCodes: [],
          serviceNeeds: [],
        },
      });
    }

    const nextPath = inviteToken
      ? `/invite/cleaner/${inviteToken}`
      : role === UserRole.CUSTOMER
        ? "/onboarding/homeowner"
        : getRoleHome(role);
    return NextResponse.redirect(new URL(nextPath, request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "We couldn't complete your account setup.";
    return toError(request, message, role, inviteToken);
  }
}
