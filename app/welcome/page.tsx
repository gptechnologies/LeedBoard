import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHome, requireSignedInIdentity } from "@/lib/session";

type WelcomePageProps = {
  searchParams: Promise<{
    role?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = await searchParams;
  const [{ userId }, user, identity] = await Promise.all([
    auth(),
    getCurrentUser(),
    requireSignedInIdentity(),
  ]);

  if (!userId) {
    redirect("/login");
  }

  if (user) {
    redirect(getRoleHome(user.role));
  }

  const selectedRole =
    params.role === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Finish account setup</div>
        <h1>Tell us how you’ll use WellKept.</h1>
        <p className="subtle">
          Choose the account type that fits your work with us. Homeowners can post and
          manage requests. Cleaners can bid on jobs, track work, and get paid.
        </p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <form action="/auth/onboarding" method="post" className="stack">
        <div className="field">
          <label htmlFor="role">Account type</label>
          <select id="role" name="role" defaultValue={selectedRole}>
            <option value={UserRole.CUSTOMER}>Homeowner</option>
            <option value={UserRole.CLEANER}>Cleaner</option>
          </select>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" defaultValue={identity.firstName} required />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" defaultValue={identity.lastName} required />
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" value={identity.email} readOnly />
        </div>

        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" placeholder="Optional contact number" />
        </div>

        <div className="field">
          <label htmlFor="bio">Cleaner introduction</label>
          <textarea
            id="bio"
            name="bio"
            placeholder="Optional. Share a short professional introduction if you're joining as a cleaner."
          />
        </div>

        <button type="submit">Continue to my account</button>
      </form>
    </section>
  );
}
