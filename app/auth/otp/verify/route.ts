import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { verifyOtp, type OtpChannel } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { createUserSession, getRoleHome, needsAccountSetup } from "@/lib/session";

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
    const verification = await verifyOtp(rawDestination, String(formData.get("code") || ""), channel);
    const existingIdentity =
      verification.channel === "sms"
        ? await prisma.phoneIdentity.findUnique({
            where: { phone: verification.destination },
            include: { user: true },
          })
        : null;
    const existingUser =
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

    if (verification.channel === "sms" && !existingIdentity) {
      await prisma.phoneIdentity.create({
        data: {
          phone: verification.destination,
          userId: user.id,
          phoneVerifiedAt: new Date(),
        },
      });
    }

    if (verification.channel === "sms" && (!user.phoneVerifiedAt || user.phone !== verification.destination)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phone: verification.destination,
          phoneVerifiedAt: new Date(),
        },
      });
    }

    if (verification.channel === "email" && (!user.emailVerifiedAt || user.email !== verification.destination)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: verification.destination,
          emailVerifiedAt: new Date(),
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
    return toVerifyError(request, message, rawDestination, role, channel, inviteToken);
  }
}
