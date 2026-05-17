import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getMissingVerificationChannel,
  getRoleHome,
  getVerifyContactPath,
} from "@/lib/session";

type VerifyPageProps = {
  searchParams: Promise<{
    channel?: string;
    destination?: string;
    email?: string;
    phone?: string;
    role?: string;
    mode?: string;
    error?: string;
    devCode?: string;
    inviteToken?: string;
  }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  const channel = params.channel === "email" ? "email" : "sms";
  const destination =
    params.destination || (channel === "email" ? params.email : params.phone);

  if (!destination) {
    redirect(user ? getVerifyContactPath(user, { inviteToken: params.inviteToken }) : "/login");
  }

  if (user) {
    const missingChannel = getMissingVerificationChannel(user);

    if (!missingChannel) {
      if (params.inviteToken) {
        redirect(`/invite/cleaner/${params.inviteToken}`);
      }

      redirect(getRoleHome(user.role));
    }

    if (missingChannel !== channel) {
      redirect(getVerifyContactPath(user, { inviteToken: params.inviteToken }));
    }
  }

  const role = user?.role ?? (params.role === "CLEANER" ? "CLEANER" : "CUSTOMER");
  const contactLabel = channel === "email" ? destination : params.phone || destination;

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">{channel === "email" ? "Check your email" : "Check your texts"}</div>
        <h1>Enter your one-time code.</h1>
        <p className="subtle">We sent a code to {contactLabel}.</p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}
      {params.devCode ? (
        <div className="notice">Development code: {params.devCode}</div>
      ) : null}

      <form action="/auth/otp/verify" method="post" className="stack">
        <input type="hidden" name="channel" value={channel} />
        <input type="hidden" name="destination" value={destination} />
        {channel === "sms" ? <input type="hidden" name="phone" value={destination} /> : null}
        {channel === "email" ? <input type="hidden" name="email" value={destination} /> : null}
        <input type="hidden" name="role" value={role} />
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}
        <div className="field">
          <label htmlFor="code">Code</label>
          <input
            id="code"
            name="code"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="123456"
            required
          />
        </div>
        <button type="submit">{channel === "email" ? "Verify email" : "Verify phone"}</button>
      </form>

      <form action="/auth/otp/start" method="post">
        <input type="hidden" name="mode" value={params.mode ?? "login"} />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="channel" value={channel} />
        {channel === "sms" ? <input type="hidden" name="phone" value={destination} /> : null}
        {channel === "email" ? <input type="hidden" name="email" value={destination} /> : null}
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}
        <button type="submit" className="secondary-submit">
          Send a new code
        </button>
      </form>
    </section>
  );
}
