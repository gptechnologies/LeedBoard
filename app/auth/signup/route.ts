import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getRequiredString, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applySessionCookie, createSession, getRoleHome } from "@/lib/session";

function toError(baseUrl: string, message: string) {
  return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(message)}`, baseUrl));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const roleValue = getRequiredString(formData.get("role"), "Role");

  if (roleValue !== UserRole.CUSTOMER && roleValue !== UserRole.CLEANER) {
    return toError(new URL(request.url).origin, "Please choose a valid role.");
  }

  const role = roleValue as UserRole;
  const email = getRequiredString(formData.get("email"), "Email").toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return toError(new URL(request.url).origin, "That email is already in use.");
  }

  const passwordHash = await hashPassword(getRequiredString(formData.get("password"), "Password"));
  const user = await prisma.user.create({
    data: {
      role,
      firstName: getRequiredString(formData.get("firstName"), "First name"),
      lastName: getRequiredString(formData.get("lastName"), "Last name"),
      email,
      phone: String(formData.get("phone") || "").trim() || null,
      passwordHash,
      cleanerProfile:
        role === UserRole.CLEANER
          ? {
              create: {
                isAvailable: true,
              },
            }
          : undefined,
    },
  });

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.redirect(new URL(getRoleHome(user.role), request.url));
  applySessionCookie(response, token, expiresAt);
  return response;
}
