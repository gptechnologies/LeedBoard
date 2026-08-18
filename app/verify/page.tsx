import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getMissingVerificationChannel,
  getPostAuthPath,
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
    returnTo?: string;
  }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  const channel = "email";
  const destination = params.email || params.destination;

  if (!destination) {
    redirect(user ? getVerifyContactPath(user, { inviteToken: params.inviteToken, returnTo: params.returnTo }) : "/login");
  }

  if (user) {
    const missingChannel = getMissingVerificationChannel(user);

    if (!missingChannel) {
      redirect(getPostAuthPath({ inviteToken: params.inviteToken, returnTo: params.returnTo, role: user.role }));
    }

    if (missingChannel !== channel) {
      redirect(getVerifyContactPath(user, { inviteToken: params.inviteToken, returnTo: params.returnTo }));
    }
  }

  const role = user?.role ?? (params.role === "CLEANER" ? "CLEANER" : "CUSTOMER");
  const contactLabel = destination;

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Check your email</div>
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
        <input type="hidden" name="email" value={destination} />
        <input type="hidden" name="role" value={role} />
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}
        {params.returnTo ? <input type="hidden" name="returnTo" value={params.returnTo} /> : null}
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
        <button type="submit">Verify email</button>
      </form>

      <form action="/auth/otp/start" method="post">
        <input type="hidden" name="mode" value={params.mode ?? "login"} />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="channel" value={channel} />
        <input type="hidden" name="email" value={destination} />
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}
        {params.returnTo ? <input type="hidden" name="returnTo" value={params.returnTo} /> : null}
        <button type="submit" className="secondary-submit">
          Send a new code
        </button>
      </form>
    </section>
  );
}
