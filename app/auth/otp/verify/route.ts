import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { createUserSession, getRoleHome, needsAccountSetup } from "@/lib/session";

function getRole(value: FormDataEntryValue | null) {
  return value === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;
}

function toVerifyError(
  request: Request,
  message: string,
  phone: string,
  role: UserRole,
  inviteToken?: string,
) {
  const search = new URLSearchParams({
    error: message,
    phone,
    role,
  });

  if (inviteToken) {
    search.set("inviteToken", inviteToken);
  }

  return NextResponse.redirect(new URL(`/verify?${search.toString()}`, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawPhone = String(formData.get("phone") || "");
  const inviteToken = String(formData.get("inviteToken") || "").trim();
  const role = getRole(formData.get("role"));

  try {
    const phone = await verifyOtp(rawPhone, String(formData.get("code") || ""));
    const existingIdentity = await prisma.phoneIdentity.findUnique({
      where: { phone },
      include: { user: true },
    });
    const existingUser =
      existingIdentity?.user ??
      (await prisma.user.findFirst({
        where: { phone, role },
        orderBy: { updatedAt: "desc" },
      }));
    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          phone,
          phoneVerifiedAt: new Date(),
          role,
          firstName: "",
          lastName: "",
        },
      }));

    if (!existingIdentity) {
      await prisma.phoneIdentity.create({
        data: {
          phone,
          userId: user.id,
          phoneVerifiedAt: new Date(),
        },
      });
    }

    if (!user.phoneVerifiedAt || user.phone !== phone) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phone,
          phoneVerifiedAt: new Date(),
        },
      });
    }

    await createUserSession(user.id);

    if (needsAccountSetup(user)) {
      const path = inviteToken
        ? `/welcome?role=${user.role}&inviteToken=${encodeURIComponent(inviteToken)}`
        : `/welcome?role=${user.role}`;
      return NextResponse.redirect(new URL(path, request.url));
    }

    if (inviteToken) {
      return NextResponse.redirect(new URL(`/invite/cleaner/${inviteToken}`, request.url));
    }

    if (user.role === UserRole.CUSTOMER && !user.homeownerOnboardingCompletedAt) {
      return NextResponse.redirect(new URL("/onboarding/homeowner", request.url));
    }

    return NextResponse.redirect(new URL(getRoleHome(user.role), request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "We couldn't verify that code.";
    return toVerifyError(request, message, rawPhone, role, inviteToken);
  }
}
