import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHome } from "@/lib/session";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    inviteToken?: string;
    role?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const selectedRole =
    params.role === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;

  if (user && params.inviteToken) {
    redirect(`/invite/cleaner/${params.inviteToken}`);
  }

  if (user) {
    redirect(getRoleHome(user.role));
  }

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Get started</div>
        <h1>Create your account with email.</h1>
        <p className="subtle">
          We will send a one-time code, then collect only the details needed to
          post jobs or bid on work.
        </p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <form action="/auth/otp/start" method="post" className="stack">
        <input type="hidden" name="mode" value="signup" />
        <input type="hidden" name="role" value={selectedRole} />
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
        <button type="submit">
          {selectedRole === UserRole.CLEANER ? "Continue as cleaner" : "Continue as homeowner"}
        </button>
      </form>

      <form action="/auth/otp/start" method="post" className="stack auth-alt-form">
        <input type="hidden" name="mode" value="signup" />
        <input type="hidden" name="role" value={selectedRole} />
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
