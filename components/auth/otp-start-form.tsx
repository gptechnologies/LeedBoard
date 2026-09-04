"use client";

import { useId } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";

type OtpStartFormProps = {
  error?: string;
  inviteToken?: string;
  mode: "login" | "signup";
  role: "CUSTOMER" | "CLEANER";
  returnTo?: string;
};

export function OtpStartForm({ error, inviteToken, mode, returnTo, role }: OtpStartFormProps) {
  const inputId = useId();
  const roleLabel = role === "CUSTOMER" ? "homeowner" : "cleaner";
  const heading = mode === "signup"
    ? `Create your ${roleLabel} account`
    : "Welcome back";
  const intro = mode === "signup"
    ? `Use your email to create a ${roleLabel} account.`
    : `Sign in to your ${roleLabel} account with a one-time code.`;

  return (
    <section className="auth-shell auth-passcode-card">
      <div className="auth-intro">
        <span className="eyebrow">{role === "CUSTOMER" ? "Homeowner" : "Cleaner"}</span>
        <h1>{heading}</h1>
        <p>{intro}</p>
      </div>

      {error ? <div className="notice error">{error}</div> : null}

      <form action="/auth/otp/start" method="post" className="auth-passcode-form">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="channel" value="email" />
        {inviteToken ? <input type="hidden" name="inviteToken" value={inviteToken} /> : null}
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

        <label className="auth-contact-field" htmlFor={inputId}>
          <span className="sr-only">Email address</span>
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
        <Link
          className="auth-switch-role"
          href={mode === "signup" ? `/signup?role=${role === "CUSTOMER" ? "CLEANER" : "CUSTOMER"}` : "/login"}
        >
          {mode === "signup"
            ? `Create a ${role === "CUSTOMER" ? "cleaner" : "homeowner"} account instead`
            : "Use a different account type"}
        </Link>
      </form>

      <p className="auth-legal">
        We use your email to verify your account and send important job updates. By continuing,
        you agree to our <Link href="/terms">Terms</Link> and acknowledge our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </section>
  );
}
