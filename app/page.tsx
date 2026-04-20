import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser, getRoleHome } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ userId }, user] = await Promise.all([auth(), getCurrentUser()]);

  return (
    <div className="stack">
      <section className="hero hero-premium">
        <div className="stack">
          <div className="eyebrow">WellKept for cleaners and homeowners</div>
          <h1>Post jobs, compare bids, and keep every clean moving.</h1>
          <p>
            WellKept helps homeowners find the right cleaner and gives cleaners a simple
            place to win work, stay organized, and get paid automatically.
          </p>
          <div className="hero-actions">
            <Link
              href={user ? getRoleHome(user.role) : userId ? "/welcome" : "/signup?role=CUSTOMER"}
              className="button-link"
            >
              {user ? "Open my account" : userId ? "Complete setup" : "Create an account"}
            </Link>
            <Link href="/login" className="button-link secondary">
              {userId ? "Account access" : "Sign in"}
            </Link>
          </div>
          <div className="inline-metrics">
            <div className="metric-pill">
              <strong>Post once, receive bids</strong>
              <span>Homeowners can compare cleaners on their own timeline.</span>
            </div>
            <div className="metric-pill">
              <strong>Automatic payouts</strong>
              <span>Cleaners get paid when work is completed and confirmed.</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-capsule">
            <div className="hero-capsule__glow" />
            <div className="hero-capsule__home">
              <div className="hero-capsule__roof" />
              <div className="hero-capsule__door" />
            </div>
          </div>
          <div className="hero-floating-card hero-floating-card--top">
            <span>For homeowners</span>
            <strong>Accept bids on your schedule</strong>
          </div>
          <div className="hero-floating-card hero-floating-card--bottom">
            <span>For cleaners</span>
            <strong>Bid, complete the job, get paid</strong>
          </div>
        </div>
      </section>

      <section className="grid three">
        <article className="feature-card stack small">
          <div className="eyebrow">Booking</div>
          <h2>Post or bid in a few quick steps</h2>
          <p className="subtle">
            Homeowners create a request, cleaners review the details, and both sides move
            forward without scheduling friction.
          </p>
        </article>
        <article className="feature-card stack small">
          <div className="eyebrow">Service</div>
          <h2>Know what the job requires</h2>
          <p className="subtle">
            Rooms, timing, access notes, and cleaner offers all stay attached to one clear
            request flow from bid to completion.
          </p>
        </article>
        <article className="feature-card stack small">
          <div className="eyebrow">Support</div>
          <h2>Keep the process straightforward</h2>
          <p className="subtle">
            WellKept keeps the workflow visible for both sides with cleaner status,
            homeowner acceptance, and automatic payment handling.
          </p>
        </article>
      </section>

      <section className="section-shell stack audience-shell">
        <div className="section-heading">
          <div className="eyebrow">How it works</div>
          <h2>Two simple paths, one shared marketplace.</h2>
          <p className="subtle">
            WellKept stays simple: homeowners post the job they need, and cleaners decide
            what to bid based on the work in front of them.
          </p>
        </div>

        <div className="audience-grid">
          <article className="feature-card audience-card stack">
            <div className="eyebrow">For cleaners</div>
            <h2>Win work without chasing leads.</h2>
            <ol className="guide-list">
              <li className="guide-step">
                <strong>Sign up with your website or Google Business Profile.</strong>
              </li>
              <li className="guide-step">
                <strong>Start bidding on jobs and complete the work you win.</strong>
              </li>
              <li className="guide-step">
                <strong>Get paid automatically when the job is finished.</strong>
              </li>
            </ol>
          </article>

          <article className="feature-card audience-card stack">
            <div className="eyebrow">For homeowners</div>
            <h2>Find the right cleaner on your timing.</h2>
            <ol className="guide-list">
              <li className="guide-step">
                <strong>Create your account.</strong>
              </li>
              <li className="guide-step">
                <strong>Post your job with the rooms, timing, and access details.</strong>
              </li>
              <li className="guide-step">
                <strong>Start accepting bids on the schedule that works for you.</strong>
              </li>
            </ol>
          </article>
        </div>
      </section>
    </div>
  );
}
