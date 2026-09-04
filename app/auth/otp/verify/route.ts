import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { verifyOtp, type OtpChannel } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import {
  createUserSession,
  getCurrentUser,
  getPostAuthPath,
  getSafeReturnTo,
  needsAccountSetup,
} from "@/lib/session";

function getRole(value: FormDataEntryValue | null) {
  return value === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;
}

function toVerifyError(
  request: Request,
  message: string,
  destination: string,
  role: UserRole,
  channel: OtpChannel,
  mode: string,
  inviteToken?: string,
  returnTo?: string,
) {
  const search = new URLSearchParams({
    channel,
    destination,
    error: message,
    role,
    mode,
  });

  if (channel === "email") {
    search.set("email", destination);
  } else {
    search.set("phone", destination);
  }

  if (inviteToken) {
    search.set("inviteToken", inviteToken);
  }
  if (returnTo) search.set("returnTo", returnTo);

  return NextResponse.redirect(new URL(`/verify?${search.toString()}`, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const channel: OtpChannel = "email";
  const rawDestination =
    String(formData.get("destination") || "") ||
    String(formData.get("email") || "");
  const inviteToken = String(formData.get("inviteToken") || "").trim();
  const returnTo = getSafeReturnTo(String(formData.get("returnTo") || "")) ?? undefined;
  const role = getRole(formData.get("role"));
  const mode = String(formData.get("mode") || "login") === "signup" ? "signup" : "login";

  try {
    const currentUser = await getCurrentUser();
    const verification = await verifyOtp(rawDestination, String(formData.get("code") || ""), channel);
    if (currentUser) {
      const existingEmailUser = await prisma.user.findFirst({
        where: {
          email: verification.destination,
          id: { not: currentUser.id },
        },
      });

      if (existingEmailUser) {
        throw new Error("That email is already connected to another account.");
      }
    }

    const existingUser = currentUser ?? await prisma.user.findFirst({
      where: { email: verification.destination },
      orderBy: { updatedAt: "desc" },
    });

    if (existingUser && !currentUser && existingUser.role !== role) {
      throw new Error("That email is connected to a different Well Kept account type.");
    }
    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          email: verification.destination,
          emailVerifiedAt: new Date(),
          phone: null,
          phoneVerifiedAt: null,
          role,
          firstName: "",
          lastName: "",
        },
      }));

    const verifiedAt = new Date();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: verification.destination,
        emailVerifiedAt: verifiedAt,
      },
    });

    if (!currentUser) {
      await createUserSession(updatedUser.id);
    }

    if (needsAccountSetup(updatedUser)) {
      const search = new URLSearchParams({ role: updatedUser.role });
      if (inviteToken) search.set("inviteToken", inviteToken);
      if (returnTo) search.set("returnTo", returnTo);
      const path = `/welcome?${search.toString()}`;
      return NextResponse.redirect(new URL(path, request.url));
    }

    return NextResponse.redirect(new URL(getPostAuthPath({ inviteToken, returnTo, role: updatedUser.role }), request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "We couldn't verify that code.";
    return toVerifyError(request, message, rawDestination, role, channel, mode, inviteToken, returnTo);
  }
}
