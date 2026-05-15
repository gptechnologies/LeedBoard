import { normalizePhone } from "@/lib/session";

const TWILIO_VERIFY_BASE_URL = "https://verify.twilio.com/v2/Services";
const DEV_OTP_CODE = "000000";

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

export async function sendOtp(rawPhone: string) {
  const phone = normalizePhone(rawPhone);
  const config = getTwilioConfig();

  if (!config) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Phone verification is not configured.");
    }

    return { phone, devCode: DEV_OTP_CODE };
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

  return { phone, devCode: null };
}

export async function verifyOtp(rawPhone: string, rawCode: string) {
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

    return phone;
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

  return phone;
}
