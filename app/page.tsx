import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser, getRoleHome } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New York Home Cleaning Marketplace | Well Kept",
  description:
    "Well Kept connects New York homeowners and apartment renters with professional cleaners on demand, while helping cleaners win hot local cleaning leads.",
  keywords: [
    "New York home cleaning",
    "NYC apartment cleaning",
    "home cleaners New York",
    "cleaning marketplace",
    "on demand cleaners",
    "professional cleaners NYC",
  ],
};

export default async function HomePage() {
  const [{ userId }, user] = await Promise.all([auth(), getCurrentUser()]);
  const homeownerHref = user
    ? getRoleHome(user.role)
    : userId
      ? "/welcome"
      : "/signup?role=CUSTOMER";
  const cleanerHref = user
    ? getRoleHome(user.role)
    : userId
      ? "/welcome"
      : "/signup?role=CLEANER";

  return (
    <div className="landing-page stack">
      <section className="hero hero-premium landing-hero">
        <div className="landing-hero__copy stack">
          <div className="eyebrow">New York home cleaning marketplace</div>
          <h1>Book trusted home cleaners in New York on demand.</h1>
          <p>
            Well Kept connects people who need a clean home or apartment with
            professional cleaners ready to bid on the job. Post what you need,
            compare real offers, and confirm the cleaner that fits your schedule.
          </p>
          <div className="hero-actions landing-audience-actions">
            <Link href={homeownerHref} className="button-link">
              Log in as Homeowner
            </Link>
            <Link href={cleanerHref} className="button-link secondary">
              Log in as Cleaner
            </Link>
          </div>
          <div className="landing-proof-row" aria-label="Well Kept marketplace benefits">
            <span>New York homes and apartments</span>
            <span>Professional cleaner bids</span>
            <span>On-demand job requests</span>
          </div>
        </div>

        <div className="landing-glass-preview" aria-hidden="true">
          <div className="landing-request-card glass-card">
            <span>Homeowner request</span>
            <strong>2 bed apartment cleaning</strong>
            <p>Upper West Side · Flexible today</p>
          </div>
          <div className="landing-bid-stack">
            <div className="landing-bid-card glass-card">
              <span>Cleaner bid</span>
              <strong>$140 flat</strong>
              <p>4.9 rating · arrives 2-4 PM</p>
            </div>
            <div className="landing-bid-card glass-card is-featured">
              <span>Confirmed</span>
              <strong>Cleaner booked</strong>
              <p>Payment handled after completion</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-flow-grid" aria-labelledby="marketplace-flow-heading">
        <div className="landing-section-heading">
          <div className="eyebrow">How Well Kept works</div>
          <h2 id="marketplace-flow-heading">One marketplace for clean homes and booked calendars.</h2>
        </div>

        <div className="landing-flow-columns">
          <article className="landing-flow-card glass-card">
            <div>
              <span className="step-number">For homeowners</span>
              <h3>Get your home or apartment cleaned without searching around.</h3>
            </div>
            <ol className="landing-flow-list">
              <li>
                <strong>Post a Job</strong>
                <span>Tell cleaners what you need, where you are, and when you want it done.</span>
              </li>
              <li>
                <strong>Compare Bids</strong>
                <span>Review bids from professional cleaners looking for work in your area.</span>
              </li>
              <li>
                <strong>Confirm your cleaner</strong>
                <span>Pick the right offer and enjoy a clean home.</span>
              </li>
            </ol>
          </article>

          <article className="landing-flow-card glass-card">
            <div>
              <span className="step-number">For cleaners</span>
              <h3>Turn local cleaning demand into paid work.</h3>
            </div>
            <ol className="landing-flow-list">
              <li>
                <strong>Sign up with your website or Google Business Profile</strong>
                <span>Show homeowners who you are and where you work.</span>
              </li>
              <li>
                <strong>Bid on Jobs</strong>
                <span>See hot leads from people actively looking for home cleaning.</span>
              </li>
              <li>
                <strong>Get paid automatically</strong>
                <span>Complete the job and receive payment after completion.</span>
              </li>
            </ol>
          </article>
        </div>
      </section>
    </div>
  );
}
