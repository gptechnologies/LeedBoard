import Link from "next/link";
import { UserRole } from "@prisma/client";
import { JobRequestCard, RecommendedCleanerCard } from "@/components/marketplace/cards";
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
  const { jobs, recommendedCleaners } = await getCustomerHomeData(user.id);
  const openJobs = jobs.filter((job) => job.status === "OPEN");

  return (
    <div className="market-shell">
      <section className="market-surface">
        {params.error ? <div className="notice error">{params.error}</div> : null}

        <section className="market-hero-card market-hero-card--compact">
          <div className="stack small">
            <span className="market-kicker">Welcome back</span>
            <strong className="market-hero-card__title">{user.firstName}, book a clean home fast</strong>
          </div>
          <Link href="/customer/jobs/new" className="button-link">
            Post a Job
          </Link>
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
            <h2>Top Rated Cleaners</h2>
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
