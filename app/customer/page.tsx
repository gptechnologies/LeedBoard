import Link from "next/link";
import { UserRole } from "@prisma/client";
import { JobRequestCard } from "@/components/marketplace/cards";
import { MobileNav } from "@/components/marketplace/mobile-nav";
import { getCustomerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CustomerDashboardProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CustomerDashboard({ searchParams }: CustomerDashboardProps) {
  const user = await requireUser(UserRole.CUSTOMER);
  const params = await searchParams;
  const { jobs } = await getCustomerHomeData(user.id);

  return (
    <div className="market-shell">
      <section className="market-surface">
        {params.error ? <div className="notice error">{params.error}</div> : null}

        <header className="mobile-home-head">
          <div>
            <h1>Well Kept</h1>
            <p>Find trusted cleaners for your home.</p>
          </div>
          <span className="notification-dot" aria-label="Notifications" />
        </header>

        <Link href="/customer/jobs/new" className="market-hero-card market-hero-card--compact">
          <span className="market-hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m4 11 8-7 8 7" />
              <path d="M6.5 10.5V20h11v-9.5" />
              <path d="M10 20v-5h4v5" />
              <path d="M17 4v4" />
              <path d="M15 6h4" />
            </svg>
          </span>
          <span className="stack small">
            <strong className="market-hero-card__title">Post a Cleaning Job</strong>
            <span className="subtle">Tell us what you need and get bids.</span>
          </span>
          <span className="market-hero-arrow" aria-hidden="true">&gt;</span>
        </Link>

        <section className="stack">
          <div className="market-section-heading">
            <h2>Your Open Jobs</h2>
            {jobs.length > 0 ? <Link href="/customer/jobs">View all</Link> : null}
          </div>
          {jobs.length === 0 ? (
            <section className="market-empty">
              <strong>No jobs posted yet</strong>
              <p className="market-card__copy">
                Post a cleaning job and vetted cleaners will send their own offers.
              </p>
            </section>
          ) : (
            <div className="market-rail">
              {jobs.slice(0, 3).map((job) => (
                <JobRequestCard
                  key={job.id}
                  job={job}
                  href={
                    job.status === "OPEN"
                      ? `/customer/jobs/${job.id}/bids`
                      : `/customer/jobs/${job.id}`
                  }
                  showAcceptedCleaner
                />
              ))}
            </div>
          )}
        </section>

        <section className="stack">
          <div className="market-section-heading">
            <h2>How it works</h2>
          </div>
          <div className="how-it-works">
            <article>
              <span>1</span>
              <strong>Post job</strong>
              <p>Tell cleaners what you need and when.</p>
            </article>
            <article>
              <span>2</span>
              <strong>Receive bids</strong>
              <p>Vetted cleaners submit their best offers.</p>
            </article>
            <article>
              <span>3</span>
              <strong>Book with confidence</strong>
              <p>Choose the cleaner that fits your job.</p>
            </article>
          </div>
        </section>

        <section className="trust-panel">
          <div className="trust-panel__seal" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z" />
              <path d="m8.5 12 2.2 2.2 4.8-5" />
            </svg>
          </div>
          <div>
            <strong>Vetted cleaning businesses</strong>
            <p>Every cleaner is reviewed before they can bid on your job.</p>
          </div>
        </section>

      </section>
      <MobileNav role="customer" />
    </div>
  );
}
