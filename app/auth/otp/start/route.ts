import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendOtp, type OtpChannel } from "@/lib/otp";

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
  const channel = formData.get("channel") === "email" ? "email" : "sms";
  const destinationField = channel === "email" ? "email" : "phone";
  const destination = String(formData.get(destinationField) || "");

  try {
    const result = await sendOtp(destination, channel as OtpChannel);
    const search = new URLSearchParams({
      channel: result.channel,
      destination: result.destination,
      role,
      mode,
    });

    if (result.channel === "sms" && "phone" in result) {
      search.set("phone", result.phone);
    }

    if (result.channel === "email") {
      search.set("email", result.destination);
    }

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
