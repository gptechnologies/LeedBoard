"use client";

import { useId, useState } from "react";
import { LockKeyhole, Mail, Phone } from "lucide-react";

type OtpChannel = "sms" | "email";

type OtpStartFormProps = {
  error?: string;
  inviteToken?: string;
  mode: "login" | "signup";
  role: "CUSTOMER" | "CLEANER";
};

export function OtpStartForm({ error, inviteToken, mode, role }: OtpStartFormProps) {
  const [channel, setChannel] = useState<OtpChannel>("sms");
  const inputId = useId();
  const isEmail = channel === "email";

  return (
    <section className="auth-shell auth-passcode-card">
      <div className="auth-intro">
        <h1>Get started</h1>
        <p>Sign up or log in with a one-time passcode</p>
      </div>

      {error ? <div className="notice error">{error}</div> : null}

      <form action="/auth/otp/start" method="post" className="auth-passcode-form">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="channel" value={channel} />
        {inviteToken ? <input type="hidden" name="inviteToken" value={inviteToken} /> : null}

        <div className="auth-channel-toggle" aria-label="Choose passcode delivery method">
          <button
            type="button"
            className={channel === "sms" ? "is-selected" : ""}
            aria-pressed={channel === "sms"}
            onClick={() => setChannel("sms")}
          >
            <Phone aria-hidden="true" size={18} />
            <span>Phone</span>
          </button>
          <button
            type="button"
            className={channel === "email" ? "is-selected" : ""}
            aria-pressed={channel === "email"}
            onClick={() => setChannel("email")}
          >
            <Mail aria-hidden="true" size={18} />
            <span>Email</span>
          </button>
        </div>

        <label className="auth-contact-field" htmlFor={inputId}>
          {isEmail ? (
            <Mail aria-hidden="true" size={22} />
          ) : (
            <Phone aria-hidden="true" size={22} />
          )}
          <input
            id={inputId}
            key={channel}
            name={isEmail ? "email" : "phone"}
            autoComplete={isEmail ? "email" : "tel"}
            inputMode={isEmail ? "email" : "tel"}
            placeholder={isEmail ? "Enter your email address" : "Enter your phone number"}
            required
            type={isEmail ? "email" : "tel"}
          />
        </label>

        <p className="auth-helper">We'll send you a one-time passcode (OTP).</p>

        <button type="submit" className="auth-send-button">
          Send code
        </button>

        <div className="auth-password-note">
          <LockKeyhole aria-hidden="true" size={16} />
          <span>No password needed</span>
        </div>
      </form>

      <p className="auth-legal">
        By continuing, you agree to our <strong>Terms</strong> &amp;{" "}
        <strong>Privacy Policy</strong>.
      </p>
    </section>
  );
}
