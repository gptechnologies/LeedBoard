import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHome } from "@/lib/session";

type WelcomePageProps = {
  searchParams: Promise<{
    error?: string;
    inviteToken?: string;
    role?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.firstName.trim() && user.lastName.trim() && params.inviteToken) {
    redirect(`/invite/cleaner/${params.inviteToken}`);
  }

  if (user.firstName.trim() && user.lastName.trim()) {
    redirect(getRoleHome(user.role));
  }

  const selectedRole =
    params.role === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;
  const isCleaner = selectedRole === UserRole.CLEANER;
  const roleLabel = isCleaner ? "Cleaner" : "Homeowner";

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Finish account setup</div>
        <h1>{roleLabel} account setup.</h1>
        <p className="subtle">
          {isCleaner
            ? "Create your cleaner profile so you can review local jobs and submit bids."
            : "Create your homeowner account so you can save your home and post cleaning jobs."}
        </p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <form action="/auth/onboarding" method="post" className="stack">
        <input type="hidden" name="role" value={selectedRole} />
        {params.inviteToken ? (
          <input type="hidden" name="inviteToken" value={params.inviteToken} />
        ) : null}

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
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" value={user.phone ?? ""} readOnly />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="Optional" />
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
          {isCleaner ? "Continue to cleaner account" : "Continue to homeowner setup"}
        </button>
      </form>
    </section>
  );
}
