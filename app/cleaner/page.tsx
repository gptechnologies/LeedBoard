import { UserRole } from "@prisma/client";
import { EmptyState, JobStackScroll } from "@/components/marketplace";
import { AvailableJobCard } from "@/components/marketplace/cards";
import { CleanerJobsFeed } from "@/components/marketplace/cleaner-jobs-feed";
import { formatTimeAgo } from "@/lib/format";

import {
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
    id: job.id,
    title: job.title,
    areaLabel: `${job.city}, ${job.state}`,
    postedLabel: formatTimeAgo(job.createdAt),
    bedroomCount: job.homeProfile?.bedroomCount ?? null,
    bathroomCount: job.homeProfile?.bathroomCount ?? null,
    hasPets: job.homeProfile?.hasPets ?? false,
  }));

  return (
    <div className="market-shell cleaner-home-shell">
      <section className="market-surface">
        <header className="cleaner-home-head">
          <div>
            <h1>Well Kept</h1>
          </div>
          <div className="cleaner-home-user">
            <span className="cleaner-home-avatar" aria-hidden="true">
              {user.firstName.charAt(0)}
            </span>
          </div>
        </header>

        {params.error ? <div className="notice error">{params.error}</div> : null}

        <section className="stack">
          <div className="market-section-heading">
            <h2>Up Next Jobs</h2>
          </div>
          {openJobs.length > 0 ? (
            <JobStackScroll>
              {openJobs.slice(0, 3).map((job) => (
                <AvailableJobCard job={job} key={job.id} />
              ))}
            </JobStackScroll>
          ) : (
            <EmptyState
              body="Open jobs in your area will show here."
              title="No jobs yet"
            />
          )}
        </section>

        <CleanerJobsFeed jobs={feedJobs} />
      </section>
    </div>
  );
}
