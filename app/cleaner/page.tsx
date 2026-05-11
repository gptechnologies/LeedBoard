import { UserRole } from "@prisma/client";
import { CleanerUpNextJobCard, EmptyState, HomeownerOpenJobsCarousel } from "@/components/marketplace";
import { CleanerJobsFeed } from "@/components/marketplace/cleaner-jobs-feed";
import { formatTimeAgo } from "@/lib/format";

import {
  formatTimingSummary,
  getCleanerHomeData,
} from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CleanerDashboardProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CleanerDashboard({ searchParams }: CleanerDashboardProps) {
  const user = await requireUser(UserRole.CLEANER);
  const params = await searchParams;
  const { openJobs } = await getCleanerHomeData(user.id);

  const feedJobs = openJobs.slice(0, 8).map((job) => ({
    areaLabel: `${job.city}, ${job.state}`,
    bathroomCount: job.homeProfile?.bathroomCount ?? null,
    bedroomCount: job.homeProfile?.bedroomCount ?? null,
    bidCount: job.bids.length,
    estimatedSquareFeet: job.homeProfile?.estimatedSquareFeet ?? null,
    hasPets: job.homeProfile?.hasPets ?? false,
    id: job.id,
    job,
    postedLabel: formatTimeAgo(job.createdAt),
    timingLabel: formatTimingSummary(job),
    title: job.title,
  }));

  return (
    <div className="market-shell cleaner-home-shell">
      <section className="market-surface">
        {params.error ? <div className="notice error">{params.error}</div> : null}

        <section className="stack cleaner-upcoming-section">
          <div className="market-section-heading">
            <h2>Upcoming Jobs</h2>
          </div>
          {openJobs.length > 0 ? (
            <HomeownerOpenJobsCarousel>
              {openJobs.slice(0, 3).map((job) => (
                <CleanerUpNextJobCard
                  job={job}
                  key={job.id}
                  timingLabel={formatTimingSummary(job)}
                />
              ))}
            </HomeownerOpenJobsCarousel>
          ) : (
            <EmptyState
              body="Open jobs in your area will show here."
              title="No jobs yet"
            />
          )}
        </section>
      </section>

      <CleanerJobsFeed jobs={feedJobs} />
    </div>
  );
}
