import { BidStatus, UserRole } from "@prisma/client";
import { CleanerUpNextJobCard, HomeownerOpenJobsCarousel } from "@/components/marketplace";
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
  const { cleaner, openJobs, bids } = await getCleanerHomeData(user.id);
  const upcomingBids = bids.filter(
    (bid) => bid.status === BidStatus.SUBMITTED || bid.status === BidStatus.ACCEPTED,
  );
  const bidDefaults = {
    standardHourlyRateCents: cleaner?.cleanerProfile?.standardHourlyRateCents ?? null,
    standardFlatRateCents: cleaner?.cleanerProfile?.standardFlatRateCents ?? null,
    defaultEtaMinutes: cleaner?.cleanerProfile?.defaultEtaMinutes ?? null,
  };

  const feedJobs = openJobs.slice(0, 8).map((job) => ({
    areaLabel: `${job.city}, ${job.state}`,
    bathroomCount: job.homeProfile?.bathroomCount ?? null,
    bedroomCount: job.homeProfile?.bedroomCount ?? null,
    bidCount: job.bids.length,
    estimatedSquareFeet: job.homeProfile?.estimatedSquareFeet ?? null,
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
            <h2>Upcoming Jobs ({upcomingBids.length})</h2>
          </div>
          {upcomingBids.length > 0 ? (
            <HomeownerOpenJobsCarousel>
              {upcomingBids.slice(0, 3).map((bid) => (
                <CleanerUpNextJobCard
                  href={`/cleaner/messages/${bid.id}`}
                  job={bid.jobRequest}
                  key={bid.id}
                  showBidCta={false}
                  statusLabel={bid.status === BidStatus.ACCEPTED ? "Confirmed" : "Bid sent"}
                  timingLabel={formatTimingSummary(bid.jobRequest)}
                />
              ))}
            </HomeownerOpenJobsCarousel>
          ) : null}
        </section>
      </section>

      <CleanerJobsFeed bidDefaults={bidDefaults} jobs={feedJobs} />
    </div>
  );
}
