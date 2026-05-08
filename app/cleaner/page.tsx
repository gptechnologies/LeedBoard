import { BidStatus, RoomType, ServiceNeed, UserRole } from "@prisma/client";
import { CleanerUpNextCard } from "@/components/marketplace/cards";
import { CleanerJobsFeed } from "@/components/marketplace/cleaner-jobs-feed";

import {
  formatBidAmount,
  formatBidTiming,
  formatRoomTypes,
  formatTimingSummary,
  getCleanLevelLabel,
  getCustomerHistorySummary,
  getEntryMethodLabel,
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
  const { nextBooking, openJobs, bids } = await getCleanerHomeData(user.id);
  const feedJobs = openJobs.slice(0, 8).map((job) => ({
    id: job.id,
    title: job.title,
    timeLabel: formatTimingSummary(job),
    areaLabel: `${job.city}, ${job.state}`,
    roomsLabel: formatRoomTypes(job.roomTypes),
    cleanLevelLabel: getCleanLevelLabel(job.cleanLevel),
    entryLabel: getEntryMethodLabel(job.entryMethod),
    historyLabel: getCustomerHistorySummary({
      completedJobs: job.customerCompletedJobsSnapshot,
      customerCreatedAt: job.customerMemberSinceSnapshot ?? job.customer.createdAt,
    }),
    iconKind: getCleanerJobIconKind(job),
  }));
  const openBidPreviews = bids
    .filter((bid) => bid.status === BidStatus.SUBMITTED)
    .map((bid) => ({
      id: bid.id,
      jobId: bid.jobRequest.id,
      title: bid.jobRequest.title,
      timeLabel: formatBidTiming(bid),
      areaLabel: `${bid.jobRequest.city}, ${bid.jobRequest.state}`,
      priceLabel: formatBidAmount(bid),
    }));

  return (
    <div className="market-shell cleaner-home-shell">
      <section className="market-surface">
        <header className="cleaner-home-head">
          <div>
            <h1>Well Kept</h1>
          </div>
          <div className="cleaner-home-user">
            <span>Hi, {user.firstName}</span>
            <span className="cleaner-home-avatar" aria-hidden="true">
              {user.firstName.charAt(0)}
            </span>
          </div>
        </header>

        {params.error ? <div className="notice error">{params.error}</div> : null}

        {nextBooking ? (
          <CleanerUpNextCard booking={nextBooking} />
        ) : (
          <section className="cleaner-feature-card cleaner-feature-card--empty">
            <div className="cleaner-feature-card__heading">
              <h2>Up next (0)</h2>
            </div>
            <p>No booked visits are scheduled right now.</p>
          </section>
        )}

        <CleanerJobsFeed jobs={feedJobs} bids={openBidPreviews} />
      </section>
    </div>
  );
}

function getCleanerJobIconKind(job: {
  serviceNeeds: ServiceNeed[];
  roomTypes: RoomType[];
}): "home" | "kitchen" | "apartment" | "box" {
  if (job.serviceNeeds.includes(ServiceNeed.MOVE_OUT)) {
    return "box";
  }

  if (job.serviceNeeds.includes(ServiceNeed.KITCHEN) || job.roomTypes.includes(RoomType.KITCHEN)) {
    return "kitchen";
  }

  if (job.roomTypes.length > 2) {
    return "home";
  }

  return "apartment";
}
