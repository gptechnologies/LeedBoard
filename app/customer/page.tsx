import Link from "next/link";
import { UserRole } from "@prisma/client";
import { JobRequestCard, RecommendedCleanerCard } from "@/components/marketplace/cards";
import { MobileNav } from "@/components/marketplace/mobile-nav";
import { getCustomerHomeData, getEntryMethodLabel, getSuppliesSourceLabel } from "@/lib/marketplace";
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
  const { jobs, homeProfile, recommendedCleaners } = await getCustomerHomeData(user.id);
  const openJobs = jobs.filter((job) => job.status === "OPEN");

  return (
    <div className="market-shell">
      <section className="market-surface">
        <header className="market-topbar">
          <div>
            <div className="market-kicker">Welcome back</div>
            <h1>{user.firstName}, book a cleaner fast.</h1>
          </div>
          <Link href="/customer/jobs/new" className="market-icon-button">
            +
          </Link>
        </header>

        {params.error ? <div className="notice error">{params.error}</div> : null}

        <section className="market-hero-card">
          <div className="stack small">
            <span className="market-kicker">Start a new request</span>
            <strong>Post a job with your saved home setup.</strong>
            <p className="market-card__copy">
              Pick the rooms, set your priorities, and let cleaners come to you with bids.
            </p>
          </div>
          <Link href="/customer/jobs/new" className="button-link">
            {homeProfile ? "Post with My Home" : "Set Up and Post"}
          </Link>
        </section>

        <section className="market-card">
          <div className="market-section-heading">
            <h2>My Home</h2>
            <Link href="/customer/my-home" className="market-text-link">
              {homeProfile ? "Edit" : "Set up"}
            </Link>
          </div>
          {homeProfile ? (
            <div className="stack small">
              <strong>{homeProfile.label}</strong>
              <span className="market-card__meta">
                {homeProfile.addressLine1}, {homeProfile.city}, {homeProfile.state} {homeProfile.postalCode}
              </span>
              <span className="market-card__meta">
                {getEntryMethodLabel(homeProfile.entryMethod)} · {getSuppliesSourceLabel(homeProfile.suppliesSource)}
              </span>
            </div>
          ) : (
            <p className="market-card__copy">
              Save your address, entry notes, and supply preference once so future jobs are mostly prefilled.
            </p>
          )}
        </section>

        <section className="stack">
          <div className="market-section-heading">
            <h2>My Open Jobs</h2>
            {openJobs.length > 0 ? <span>{openJobs.length} open</span> : null}
          </div>
          {jobs.length === 0 ? (
            <section className="market-empty">
              <strong>No jobs posted yet.</strong>
              <p className="market-card__copy">
                Your posted requests will appear here with bid counts and cleaner offers.
              </p>
            </section>
          ) : (
            <div className="market-rail">
              {jobs.map((job) => (
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
            <h2>Recommended Cleaners</h2>
            <span>Near your latest request</span>
          </div>
          <div className="market-rail">
            {recommendedCleaners.map((cleaner) => (
              <RecommendedCleanerCard key={cleaner.id} cleaner={cleaner} />
            ))}
          </div>
        </section>
      </section>
      <MobileNav role="customer" />
    </div>
  );
}
