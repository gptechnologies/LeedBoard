import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHome } from "@/lib/session";

type VerifyPageProps = {
  searchParams: Promise<{
    phone?: string;
    role?: string;
    error?: string;
    devCode?: string;
    inviteToken?: string;
  }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (user && params.inviteToken) {
    redirect(`/invite/cleaner/${params.inviteToken}`);
  }

  if (user) {
    redirect(getRoleHome(user.role));
  }

  if (!params.phone) {
    redirect("/login");
  }

  const role = params.role === "CLEANER" ? "CLEANER" : "CUSTOMER";

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Check your texts</div>
        <h1>Enter your one-time code.</h1>
        <p className="subtle">We sent a code to {params.phone}.</p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}
      {params.devCode ? (
        <div className="notice">Development code: {params.devCode}</div>
      ) : null}

      <form action="/auth/otp/verify" method="post" className="stack">
        <input type="hidden" name="phone" value={params.phone} />
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
        <button type="submit">Verify phone</button>
      </form>

      <form action="/auth/otp/start" method="post">
        <input type="hidden" name="mode" value="login" />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="phone" value={params.phone} />
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
