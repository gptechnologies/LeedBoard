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
  channel: string,
  inviteToken?: string,
  returnTo?: string,
) {
  const search = new URLSearchParams({
    channel,
    error: message,
    role,
  });

  if (inviteToken) {
    search.set("inviteToken", inviteToken);
  }
  if (returnTo) search.set("returnTo", returnTo);

  const pathname =
    mode === "verify-contact" ? "/verify-contact" : mode === "signup" ? "/signup" : "/login";
  return NextResponse.redirect(new URL(`${pathname}?${search.toString()}`, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const inviteToken = String(formData.get("inviteToken") || "").trim();
  const returnTo = String(formData.get("returnTo") || "").trim();
  const role = getRole(formData.get("role"));
  const mode = String(formData.get("mode") || "login");
  const channel = "email";
  const destination = String(formData.get("email") || formData.get("destination") || "");

  try {
    const result = await sendOtp(destination, channel);
    const search = new URLSearchParams({
      channel: result.channel,
      destination: result.destination,
      role,
      mode,
    });

    if (result.channel === "sms" && "phone" in result) {
      search.set("phone", result.phone);
    }

    if (inviteToken) {
      search.set("inviteToken", inviteToken);
    }
    if (returnTo) search.set("returnTo", returnTo);

    if (result.devCode) {
      search.set("devCode", result.devCode);
    }

    return NextResponse.redirect(new URL(`/verify?${search.toString()}`, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "We couldn't send that code.";
    return toError(request, message, role, mode, channel, inviteToken, returnTo);
  }
}
