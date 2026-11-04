import Link from "next/link";
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const p = await searchParams;
  return (
    <form action="/leads/subscribe" method="post" className="effortless-form">
      <header>
        <p className="effortless-kicker">For local cleaning businesses</p>
        <h1>
          Real leads.
          <br />
          Straight to your inbox.
        </h1>
        <p>
          Send your total price and next availability. No account or app needed.
        </p>
      </header>
      {p.error && (
        <p role="alert" className="effortless-error">
          {p.error}
        </p>
      )}
      {p.sent && (
        <p role="status" className="effortless-status">
          Check your inbox to confirm your email and start receiving leads.
        </p>
      )}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Business name or website
        <input
          name="business"
          required
          maxLength={160}
          autoComplete="organization"
        />
      </label>
      <label>
        Service ZIP
        <input
          name="postalCode"
          required
          pattern="[0-9]{5}"
          inputMode="numeric"
          maxLength={5}
        />
      </label>
      <label>
        Other service ZIPs <small>Optional, separated by commas</small>
        <input name="extraZips" placeholder="10001, 10002" />
      </label>
      <button className="effortless-primary">Get cleaning leads</button>
      <small>
        We’ll email you real cleaning requests in these ZIPs. Pause or
        unsubscribe anytime. <Link href="/privacy">Privacy</Link> ·{" "}
        <Link href="/terms">Terms</Link>
      </small>
      <Link href="/login?returnTo=/cleaner">
        Already use the cleaner app? Sign in
      </Link>
    </form>
  );
}
