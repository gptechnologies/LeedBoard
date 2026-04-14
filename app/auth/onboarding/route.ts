import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequiredString } from "@/lib/auth";
import { getRoleHome, requireSignedInIdentity } from "@/lib/session";

function toError(request: Request, message: string, role?: string) {
  const search = new URLSearchParams({
    error: message,
  });

  if (role) {
    search.set("role", role);
  }

  return NextResponse.redirect(new URL(`/welcome?${search.toString()}`, request.url));
}

export async function POST(request: Request) {
  const identity = await requireSignedInIdentity();
  const formData = await request.formData();
  const roleValue = getRequiredString(formData.get("role"), "Role");
  const role =
    roleValue === UserRole.CLEANER
      ? UserRole.CLEANER
      : roleValue === UserRole.CUSTOMER
        ? UserRole.CUSTOMER
        : null;

  if (!role) {
    return toError(request, "Please choose a valid account type.");
  }

  try {
    const firstName =
      String(formData.get("firstName") || "").trim() || identity.firstName || "Archmont";
    const lastName =
      String(formData.get("lastName") || "").trim() || identity.lastName || "Member";
    const phone = String(formData.get("phone") || "").trim() || null;
    const bio = String(formData.get("bio") || "").trim() || null;

    const user = await prisma.user.upsert({
      where: { email: identity.email },
      update: {
        clerkUserId: identity.clerkUserId,
        role,
        firstName,
        lastName,
        phone,
      },
      create: {
        clerkUserId: identity.clerkUserId,
        role,
        firstName,
        lastName,
        email: identity.email,
        phone,
      },
    });

    if (role === UserRole.CLEANER) {
      await prisma.cleanerProfile.upsert({
        where: { userId: user.id },
        update: {
          bio,
          isAvailable: true,
        },
        create: {
          userId: user.id,
          bio,
          isAvailable: true,
        },
      });
    }

    return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "We couldn't complete your account setup.";
    return toError(request, message, role);
  }
}
