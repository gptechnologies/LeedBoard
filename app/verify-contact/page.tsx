import { Mail } from "lucide-react";
import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getMissingVerificationChannel,
  getRoleHome,
} from "@/lib/session";

type VerifyContactPageProps = {
  searchParams: Promise<{
    channel?: string;
    error?: string;
    inviteToken?: string;
    returnTo?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function VerifyContactPage({ searchParams }: VerifyContactPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (!user) {
    redirect("/login");
  }

  const missingChannel = getMissingVerificationChannel(user);

  if (!missingChannel) {
    if (params.inviteToken) {
      redirect(`/invite/cleaner/${params.inviteToken}`);
    }

    redirect(getRoleHome(user.role));
  }

  const channel = "email";

  return (
    <section className="auth-shell auth-passcode-card">
      <div className="auth-intro">
        <div className="eyebrow">One more verification</div>
        <h1>Add your email.</h1>
        <p>Verify an email to keep access to your existing Well Kept account.</p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <form action="/auth/otp/start" method="post" className="auth-passcode-form">
        <input type="hidden" name="mode" value="verify-contact" />
        <input type="hidden" name="role" value={user.role} />
        <input type="hidden" name="channel" value={channel} />
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}
        {params.returnTo ? <input type="hidden" name="returnTo" value={params.returnTo} /> : null}

        <label className="auth-contact-field" htmlFor="contact">
          <Mail aria-hidden="true" size={22} />
          <input
            id="contact"
            aria-label="Email address"
            name="email"
            autoComplete="email"
            defaultValue={user.email ?? ""}
            inputMode="email"
            placeholder="Email address"
            required
            type="email"
          />
        </label>

        <p className="auth-helper">
          {process.env.NODE_ENV === "development"
            ? "Use development code 000000 to finish setup."
            : "We'll email a one-time passcode to finish setup."}
        </p>

        <button type="submit" className="auth-send-button">
          Send code
        </button>
      </form>
    </section>
  );
}
