import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser, getPostAuthPath, getSafeReturnTo, getVerifyContactPath, isFullyVerified } from "@/lib/session";

type WelcomePageProps = {
  searchParams: Promise<{
    error?: string;
    inviteToken?: string;
    role?: string;
    returnTo?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = await searchParams;
  const returnTo = getSafeReturnTo(params.returnTo) ?? undefined;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isFullyVerified(user)) {
    redirect(getVerifyContactPath(user, { inviteToken: params.inviteToken, returnTo }));
  }

  if (user.firstName.trim() && user.lastName.trim()) {
    redirect(getPostAuthPath({ inviteToken: params.inviteToken, returnTo, role: user.role }));
  }

  const selectedRole =
    params.role === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;
  const isCleaner = selectedRole === UserRole.CLEANER;

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">One last detail</div>
        <h1>Tell us your name.</h1>
        <p className="subtle">
          {isCleaner
            ? "We’ll use it on your cleaner profile and job responses."
            : "We’ll use it for your homeowner profile and important job updates."}
        </p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <form action="/auth/onboarding" method="post" className="stack">
        <input type="hidden" name="role" value={selectedRole} />
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

        <div className="field-grid">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" defaultValue={user.firstName} required />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" defaultValue={user.lastName} required />
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={user.email ?? ""}
            placeholder={user.email ? undefined : "Optional"}
            readOnly={Boolean(user.emailVerifiedAt)}
          />
        </div>

        {isCleaner ? (
          <>
            <div className="field">
              <label htmlFor="businessName">Business name</label>
              <input
                id="businessName"
                name="businessName"
                placeholder="Optional"
              />
            </div>
            <div className="field">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                inputMode="url"
                placeholder="https://example.com"
              />
            </div>
            <div className="field">
              <label htmlFor="bio">Cleaner introduction</label>
              <textarea
                id="bio"
                name="bio"
                placeholder="Optional. Share a short professional introduction."
              />
            </div>
          </>
        ) : null}

        <button type="submit">
          {isCleaner ? "Continue to cleaner account" : "Continue"}
        </button>
      </form>
    </section>
  );
}
