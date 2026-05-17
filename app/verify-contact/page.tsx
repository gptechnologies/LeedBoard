import { Mail, Phone } from "lucide-react";
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

  const channel = params.channel === missingChannel ? params.channel : missingChannel;
  const isEmail = channel === "email";
  const label = isEmail ? "Email address" : "Phone number";
  const defaultValue = isEmail ? user.email ?? "" : user.phone ?? "";

  return (
    <section className="auth-shell auth-passcode-card">
      <div className="auth-intro">
        <div className="eyebrow">One more verification</div>
        <h1>{isEmail ? "Verify your email." : "Verify your phone."}</h1>
        <p>
          {isEmail
            ? "Add a verified email so we can reach you about jobs and account recovery."
            : "Add a verified phone so we can reach you about jobs and account recovery."}
        </p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <form action="/auth/otp/start" method="post" className="auth-passcode-form">
        <input type="hidden" name="mode" value="verify-contact" />
        <input type="hidden" name="role" value={user.role} />
        <input type="hidden" name="channel" value={channel} />
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}

        <label className="auth-contact-field" htmlFor="contact">
          {isEmail ? (
            <Mail aria-hidden="true" size={22} />
          ) : (
            <Phone aria-hidden="true" size={22} />
          )}
          <input
            id="contact"
            aria-label={label}
            name={isEmail ? "email" : "phone"}
            autoComplete={isEmail ? "email" : "tel"}
            defaultValue={defaultValue}
            inputMode={isEmail ? "email" : "tel"}
            placeholder={isEmail ? "Email address" : "Phone number"}
            required
            type={isEmail ? "email" : "tel"}
          />
        </label>

        <p className="auth-helper">We'll send a one-time passcode to finish setup.</p>

        <button type="submit" className="auth-send-button">
          Send code
        </button>
      </form>
    </section>
  );
}
