import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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

  if (user) {
    redirect(getRoleHome(user.role));
  }

  if (userId) {
    redirect("/welcome");
  }

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
            <Link href="/signup?role=CUSTOMER" className="button-link">
              Sign up as Homeowner
            </Link>
            <Link href="/signup?role=CLEANER" className="button-link secondary">
              Sign up as Cleaner
            </Link>
          </div>
          <div className="landing-proof-row" aria-label="Well Kept marketplace benefits">
            <span>New York homes and apartments</span>
            <span>Professional cleaner bids</span>
            <span>On-demand job requests</span>
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
