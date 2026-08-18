"use client";

import { useId } from "react";
import { LockKeyhole, Mail } from "lucide-react";

type OtpStartFormProps = {
  error?: string;
  inviteToken?: string;
  mode: "login" | "signup";
  role: "CUSTOMER" | "CLEANER";
  returnTo?: string;
};

export function OtpStartForm({ error, inviteToken, mode, returnTo, role }: OtpStartFormProps) {
  const inputId = useId();

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
        <input type="hidden" name="channel" value="email" />
        {inviteToken ? <input type="hidden" name="inviteToken" value={inviteToken} /> : null}
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

        <label className="auth-contact-field" htmlFor={inputId}>
          <Mail aria-hidden="true" size={22} />
          <input
            id={inputId}
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Enter your email address"
            required
            type="email"
          />
        </label>

        <p className="auth-helper">
          {process.env.NODE_ENV === "development"
            ? "Use development code 000000 to continue."
            : "We'll email you a one-time passcode."}
        </p>

        <button type="submit" className="auth-send-button">
          Email me a code
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
