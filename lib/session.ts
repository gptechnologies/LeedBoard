import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "wellkept_session";
const SESSION_DAYS = 30;
const REQUIRE_PHONE_VERIFICATION = false;

export type SignedInIdentity = {
  userId: string;
  email: string | null;
  phone: string | null;
};

type VerificationUser = {
  role: UserRole;
  email: string | null;
  emailVerifiedAt: Date | null;
  phone: string | null;
  phoneVerifiedAt: Date | null;
};

export type MissingVerificationChannel = "email" | "sms";

export function getRoleHome(role: UserRole) {
  if (role === UserRole.CLEANER) {
    return "/cleaner";
  }

  return "/customer";
}

export function getMissingVerificationChannel(
  user: VerificationUser,
): MissingVerificationChannel | null {
  if (user.role === UserRole.ADMIN) {
    return null;
  }

  if (!user.email || !user.emailVerifiedAt) {
    return "email";
  }

  if (!REQUIRE_PHONE_VERIFICATION) {
    return null;
  }

  if (!user.phone || !user.phoneVerifiedAt) {
    return "sms";
  }

  return null;
}

export function isFullyVerified(user: VerificationUser) {
  return getMissingVerificationChannel(user) === null;
}

export function getVerifyContactPath(
  user: VerificationUser,
  options: { inviteToken?: string } = {},
) {
  const channel = getMissingVerificationChannel(user);

  if (!channel) {
    return getRoleHome(user.role);
  }

  const search = new URLSearchParams({
    channel,
    role: user.role,
  });

  if (options.inviteToken) {
    search.set("inviteToken", options.inviteToken);
  }

  return `/verify-contact?${search.toString()}`;
}

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+") && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  throw new Error("Enter a valid mobile phone number.");
}

export function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  return email;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getSessionExpiresAt() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function needsAccountSetup(user: {
  firstName: string | null;
  lastName: string | null;
}) {
  return !user.firstName?.trim() || !user.lastName?.trim();
}

export async function createUserSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = getSessionExpiresAt();

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashToken(token),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    include: {
      user: {
        include: {
          cleanerProfile: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({
        where: { id: session.id },
      });
    }
    return null;
  }

  return session.user;
}

export async function getSignedInIdentity() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    phone: user.phone,
  };
}

export async function requireSignedInIdentity() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isFullyVerified(user)) {
    redirect(getVerifyContactPath(user));
  }

  return {
    userId: user.id,
    email: user.email,
    phone: user.phone,
  };
}

export async function requireUser(role?: UserRole) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isFullyVerified(user)) {
    redirect(getVerifyContactPath(user));
  }

  if (needsAccountSetup(user)) {
    redirect(`/welcome?role=${user.role}`);
  }

  if (role && user.role !== role) {
    redirect(getRoleHome(user.role));
  }

  return user;
}

export async function requireApiUser(request: Request, role?: UserRole) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isFullyVerified(user)) {
    return NextResponse.redirect(new URL(getVerifyContactPath(user), request.url));
  }

  if (needsAccountSetup(user)) {
    return NextResponse.redirect(new URL(`/welcome?role=${user.role}`, request.url));
  }

  if (role && user.role !== role) {
    return NextResponse.redirect(new URL(getRoleHome(user.role), request.url));
  }

  return user;
}
