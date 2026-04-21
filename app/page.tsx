import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser, getRoleHome } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ userId }, user] = await Promise.all([auth(), getCurrentUser()]);

  return (
    <div className="landing-page stack">
      <section className="hero hero-premium landing-hero">
        <div className="landing-hero__copy stack">
          <div className="eyebrow">Local cleaner marketplace</div>
          <h1>Well Kept</h1>
          <p>
            Discover highly rated local cleaners on demand. Post a job, compare bids,
            and confirm the cleaner you want.
          </p>
          <div className="hero-actions">
            <Link
              href={user ? getRoleHome(user.role) : userId ? "/welcome" : "/signup?role=CUSTOMER"}
              className="button-link"
            >
              {user ? "Open my account" : userId ? "Complete setup" : "Post a job"}
            </Link>
            <Link href={userId ? "/login" : "/signup?role=CLEANER"} className="button-link secondary">
              {userId ? "Account access" : "Cleaner access"}
            </Link>
          </div>
        </div>

        <div className="landing-phone" aria-hidden="true">
          <div className="landing-phone__screen">
            <div className="landing-phone__top">
              <strong>Well Kept</strong>
              <span />
            </div>
            <div className="landing-photo">
              <div className="landing-window" />
              <div className="landing-sofa" />
            </div>
            <div className="landing-phone__card">
              <span>Post a job</span>
              <strong>Tell us what you need.</strong>
            </div>
            <div className="landing-phone__card muted">
              <span>3 bids received</span>
              <strong>Confirm when ready.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid three landing-steps">
        <article className="feature-card stack small">
          <span className="step-number">01</span>
          <h2>Post</h2>
          <p className="subtle">Share the home, rooms, timing, and access details.</p>
        </article>
        <article className="feature-card stack small">
          <span className="step-number">02</span>
          <h2>Compare</h2>
          <p className="subtle">Review cleaner bids, ratings, and arrival timing.</p>
        </article>
        <article className="feature-card stack small">
          <span className="step-number">03</span>
          <h2>Confirm</h2>
          <p className="subtle">Choose the right bid and keep the job in one place.</p>
        </article>
      </section>
    </div>
  );
}
