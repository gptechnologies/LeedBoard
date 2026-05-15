import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHome } from "@/lib/session";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    inviteToken?: string;
    role?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (user && params.inviteToken) {
    redirect(`/invite/cleaner/${params.inviteToken}`);
  }

  if (user) {
    redirect(getRoleHome(user.role));
  }

  const role = params.role === "CLEANER" ? "CLEANER" : "CUSTOMER";

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Welcome back</div>
        <h1>Sign in with email.</h1>
        <p className="subtle">
          We will send you a one-time code. No password to remember.
        </p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <form action="/auth/otp/start" method="post" className="stack">
        <input type="hidden" name="mode" value="login" />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="channel" value="email" />
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <button type="submit">Email me a code</button>
      </form>

      <form action="/auth/otp/start" method="post" className="stack auth-alt-form">
        <input type="hidden" name="mode" value="login" />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="channel" value="sms" />
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}
        <div className="field">
          <label htmlFor="phone">Use mobile phone instead</label>
          <input
            id="phone"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(555) 555-0123"
          />
        </div>
        <button type="submit" className="secondary-submit">Text me a code</button>
      </form>
    </section>
  );
}
