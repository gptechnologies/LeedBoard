import { UserRole } from "@prisma/client";

type SignupPageProps = {
  searchParams: Promise<{
    role?: string;
    error?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const selectedRole =
    params.role === UserRole.CLEANER ? UserRole.CLEANER : UserRole.CUSTOMER;

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Get started</div>
        <h1>Create your Archmont account.</h1>
        <p className="subtle">
          Customers can reserve and manage home cleanings. Providers can access assigned
          visits and day-of service details.
        </p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <form action="/auth/signup" method="post" className="stack">
        <div className="field">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" defaultValue={selectedRole}>
            <option value={UserRole.CUSTOMER}>Homeowner</option>
            <option value={UserRole.CLEANER}>Provider</option>
          </select>
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" required />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="name@email.com" required />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" placeholder="(555) 555-5555" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={6} placeholder="Create a secure password" required />
        </div>
        <button type="submit">Create account</button>
      </form>
    </section>
  );
}
