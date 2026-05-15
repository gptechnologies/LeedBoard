import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendOtp } from "@/lib/otp";

function getRole(value: FormDataEntryValue | null) {
  return value === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;
}

function toError(
  request: Request,
  message: string,
  role: UserRole,
  mode: string,
  inviteToken?: string,
) {
  const search = new URLSearchParams({
    error: message,
    role,
  });

  if (inviteToken) {
    search.set("inviteToken", inviteToken);
  }

  const pathname = mode === "signup" ? "/signup" : "/login";
  return NextResponse.redirect(new URL(`${pathname}?${search.toString()}`, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const inviteToken = String(formData.get("inviteToken") || "").trim();
  const role = getRole(formData.get("role"));
  const mode = String(formData.get("mode") || "login");

  try {
    const result = await sendOtp(String(formData.get("phone") || ""));
    const search = new URLSearchParams({
      phone: result.phone,
      role,
      mode,
    });

    if (inviteToken) {
      search.set("inviteToken", inviteToken);
    }

    if (result.devCode) {
      search.set("devCode", result.devCode);
    }

    return NextResponse.redirect(new URL(`/verify?${search.toString()}`, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "We couldn't send that code.";
    return toError(request, message, role, mode, inviteToken);
  }
}
