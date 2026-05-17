import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { verifyOtp, type OtpChannel } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import {
  createUserSession,
  getCurrentUser,
  getMissingVerificationChannel,
  getRoleHome,
  getVerifyContactPath,
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
  inviteToken?: string,
) {
  const search = new URLSearchParams({
    channel,
    destination,
    error: message,
    role,
  });

  if (channel === "email") {
    search.set("email", destination);
  } else {
    search.set("phone", destination);
  }

  if (inviteToken) {
    search.set("inviteToken", inviteToken);
  }

  return NextResponse.redirect(new URL(`/verify?${search.toString()}`, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const channel: OtpChannel = formData.get("channel") === "email" ? "email" : "sms";
  const rawDestination =
    String(formData.get("destination") || "") ||
    String(formData.get(channel === "email" ? "email" : "phone") || "");
  const inviteToken = String(formData.get("inviteToken") || "").trim();
  const role = getRole(formData.get("role"));

  try {
    const currentUser = await getCurrentUser();
    const verification = await verifyOtp(rawDestination, String(formData.get("code") || ""), channel);
    const currentMissingChannel = currentUser
      ? getMissingVerificationChannel(currentUser)
      : null;

    if (currentUser && currentMissingChannel && currentMissingChannel !== verification.channel) {
      return NextResponse.redirect(
        new URL(getVerifyContactPath(currentUser, { inviteToken }), request.url),
      );
    }

    const existingIdentity =
      verification.channel === "sms"
        ? await prisma.phoneIdentity.findUnique({
            where: { phone: verification.destination },
            include: { user: true },
          })
        : null;

    if (
      currentUser &&
      verification.channel === "sms" &&
      existingIdentity &&
      existingIdentity.userId !== currentUser.id
    ) {
      throw new Error("That phone number is already connected to another account.");
    }

    if (currentUser && verification.channel === "email") {
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

    const existingUser =
      currentUser ??
      existingIdentity?.user ??
      (verification.channel === "email"
        ? await prisma.user.findFirst({
            where: { email: verification.destination, role },
            orderBy: { updatedAt: "desc" },
          })
        : await prisma.user.findFirst({
            where: { phone: verification.destination, role },
            orderBy: { updatedAt: "desc" },
          }));
    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          email: verification.channel === "email" ? verification.destination : null,
          emailVerifiedAt: verification.channel === "email" ? new Date() : null,
          phone: verification.channel === "sms" ? verification.destination : null,
          phoneVerifiedAt: verification.channel === "sms" ? new Date() : null,
          role,
          firstName: "",
          lastName: "",
        },
      }));

    const verifiedAt = new Date();

    const updatedUser = await prisma.$transaction(async (tx) => {
      if (verification.channel === "sms") {
        await tx.phoneIdentity.upsert({
          where: { userId: user.id },
          update: {
            phone: verification.destination,
            phoneVerifiedAt: verifiedAt,
          },
          create: {
            phone: verification.destination,
            userId: user.id,
            phoneVerifiedAt: verifiedAt,
          },
        });

        return tx.user.update({
          where: { id: user.id },
          data: {
            phone: verification.destination,
            phoneVerifiedAt: verifiedAt,
          },
        });
      }

      return tx.user.update({
        where: { id: user.id },
        data: {
          email: verification.destination,
          emailVerifiedAt: verifiedAt,
        },
      });
    });

    if (!currentUser) {
      await createUserSession(updatedUser.id);
    }

    if (getMissingVerificationChannel(updatedUser)) {
      return NextResponse.redirect(
        new URL(getVerifyContactPath(updatedUser, { inviteToken }), request.url),
      );
    }

    if (needsAccountSetup(updatedUser)) {
      const path = inviteToken
        ? `/welcome?role=${updatedUser.role}&inviteToken=${encodeURIComponent(inviteToken)}`
        : `/welcome?role=${updatedUser.role}`;
      return NextResponse.redirect(new URL(path, request.url));
    }

    if (inviteToken) {
      return NextResponse.redirect(new URL(`/invite/cleaner/${inviteToken}`, request.url));
    }

    if (updatedUser.role === UserRole.CUSTOMER && !updatedUser.homeownerOnboardingCompletedAt) {
      return NextResponse.redirect(new URL("/onboarding/homeowner", request.url));
    }

    return NextResponse.redirect(new URL(getRoleHome(updatedUser.role), request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "We couldn't verify that code.";
    return toVerifyError(request, message, rawDestination, role, channel, inviteToken);
  }
}
