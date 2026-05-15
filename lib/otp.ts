import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizePhone } from "@/lib/session";

const TWILIO_VERIFY_BASE_URL = "https://verify.twilio.com/v2/Services";
const DEV_OTP_CODE = "000000";
const EMAIL_OTP_MINUTES = 10;
const OTP_CHANNEL_EMAIL = "email";

export type OtpChannel = "email" | "sms";

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    return null;
  }

  return { accountSid, authToken, serviceSid };
}

function getAuthorizationHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

export function isDevOtpEnabled() {
  return process.env.NODE_ENV !== "production" && !getTwilioConfig();
}

function hashOtpCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function createOtpCode() {
  if (process.env.NODE_ENV !== "production") {
    return DEV_OTP_CODE;
  }

  return String(randomInt(100000, 1000000));
}

function getEmailOtpExpiresAt() {
  return new Date(Date.now() + EMAIL_OTP_MINUTES * 60 * 1000);
}

async function sendEmailOtp(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const code = createOtpCode();

  await prisma.otpChallenge.create({
    data: {
      channel: OTP_CHANNEL_EMAIL,
      destination: email,
      codeHash: hashOtpCode(code),
      expiresAt: getEmailOtpExpiresAt(),
    },
  });

  if (process.env.EMAIL_OTP_MODE === "send") {
    throw new Error("Email OTP sending is not configured yet. Use dry-run mode for testing.");
  }

  return {
    channel: "email" as const,
    destination: email,
    devCode: code,
  };
}

async function verifyEmailOtp(rawEmail: string, rawCode: string) {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.trim();

  if (!/^\d{6}$/.test(code)) {
    throw new Error("Enter the code we sent to your email.");
  }

  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      channel: OTP_CHANNEL_EMAIL,
      destination: email,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!challenge) {
    throw new Error("That code expired. Send a new code and try again.");
  }

  if (challenge.attempts >= 5) {
    throw new Error("Too many attempts. Send a new code and try again.");
  }

  if (challenge.codeHash !== hashOtpCode(code)) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
    throw new Error("That code did not match.");
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: {
      attempts: {
        increment: 1,
      },
      consumedAt: new Date(),
    },
  });

  return email;
}

export async function sendOtp(rawDestination: string, channel: OtpChannel = "sms") {
  if (channel === "email") {
    return sendEmailOtp(rawDestination);
  }

  const rawPhone = rawDestination;
  const phone = normalizePhone(rawPhone);
  const config = getTwilioConfig();

  if (!config) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Phone verification is not configured.");
    }

    return { channel: "sms" as const, destination: phone, phone, devCode: DEV_OTP_CODE };
  }

  const body = new URLSearchParams({
    To: phone,
    Channel: "sms",
  });

  const response = await fetch(
    `${TWILIO_VERIFY_BASE_URL}/${config.serviceSid}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthorizationHeader(config.accountSid, config.authToken),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error("We couldn't send that code. Check the number and try again.");
  }

  return { channel: "sms" as const, destination: phone, phone, devCode: null };
}

export async function verifyOtp(
  rawDestination: string,
  rawCode: string,
  channel: OtpChannel = "sms",
) {
  if (channel === "email") {
    return {
      channel,
      destination: await verifyEmailOtp(rawDestination, rawCode),
    };
  }

  const rawPhone = rawDestination;
  const phone = normalizePhone(rawPhone);
  const code = rawCode.trim();
  const config = getTwilioConfig();

  if (!/^\d{4,10}$/.test(code)) {
    throw new Error("Enter the code we sent to your phone.");
  }

  if (!config) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Phone verification is not configured.");
    }

    if (code !== DEV_OTP_CODE) {
      throw new Error("That code did not match.");
    }

    return {
      channel,
      destination: phone,
    };
  }

  const body = new URLSearchParams({
    To: phone,
    Code: code,
  });

  const response = await fetch(
    `${TWILIO_VERIFY_BASE_URL}/${config.serviceSid}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthorizationHeader(config.accountSid, config.authToken),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error("That code did not match.");
  }

  const result = (await response.json()) as { status?: string };

  if (result.status !== "approved") {
    throw new Error("That code did not match.");
  }

  return {
    channel,
    destination: phone,
  };
}
