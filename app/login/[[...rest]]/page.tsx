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
        <h1>Sign in with your phone.</h1>
        <p className="subtle">
          We will text you a one-time code. No password to remember.
        </p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <form action="/auth/otp/start" method="post" className="stack">
        <input type="hidden" name="mode" value="login" />
        <input type="hidden" name="role" value={role} />
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}
        <div className="field">
          <label htmlFor="phone">Mobile phone</label>
          <input
            id="phone"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(555) 555-0123"
            required
          />
        </div>
        <button type="submit">Text me a code</button>
      </form>
    </section>
  );
}
