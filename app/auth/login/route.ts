import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { applySessionCookie, createSession, getRoleHome } from "@/lib/session";

function toError(baseUrl: string, message: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, baseUrl));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return toError(new URL(request.url).origin, "We could not find an account with that email.");
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return toError(new URL(request.url).origin, "Incorrect password.");
  }

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.redirect(new URL(getRoleHome(user.role), request.url));
  applySessionCookie(response, token, expiresAt);
  return response;
}

