import Link from "next/link";
import {
  BidPricingType,
  BidStatus,
  CleanLevel,
  EntryMethod,
  JobRequestStatus,
  RoomType,
  ServiceNeed,
  TimingPreference,
} from "@prisma/client";
import { formatDateLabel } from "@/lib/format";
import {
  formatBidAmount,
  formatBidTiming,
  formatRoomTypes,
  formatTimingSummary,
  getBidStatusLabel,
  getCleanLevelLabel,
  getCustomerHistorySummary,
  getEntryMethodLabel,
  getJobRequestStatusLabel,
} from "@/lib/marketplace";
import { StatusPill } from "@/components/marketplace/status-pill";

export function JobRequestCard({
  job,
  href,
  showAcceptedCleaner = false,
}: {
  job: {
    id: string;
    title: string;
    city: string;
    state: string;
    postalCode: string;
    roomTypes: RoomType[];
    cleanLevel: CleanLevel;
    timingPreference: TimingPreference;
    requestedDate: Date | null;
    requestedWindowStart: string | null;
    requestedWindowEnd: string | null;
    status: JobRequestStatus;
    bids: Array<{ id: string }>;
    acceptedBid?: {
      cleaner: {
        firstName: string;
        lastName: string;
      };
    } | null;
  };
  href: string;
  showAcceptedCleaner?: boolean;
}) {
  const tone =
    job.status === JobRequestStatus.AWARDED
      ? "success"
      : job.status === JobRequestStatus.CANCELLED
        ? "danger"
        : job.status === JobRequestStatus.EXPIRED
          ? "warning"
          : "default";

  return (
    <Link href={href} className="market-card market-card--job">
      <div className="market-card__header">
        <div>
          <strong>{job.title}</strong>
          <div className="market-card__meta">
            {job.city}, {job.state} {job.postalCode}
          </div>
        </div>
        <StatusPill label={getJobRequestStatusLabel(job.status)} tone={tone} />
      </div>
      <div className="market-card__meta">{formatRoomTypes(job.roomTypes)}</div>
      <div className="market-card__meta">{getCleanLevelLabel(job.cleanLevel)}</div>
      <div className="market-card__meta">{formatTimingSummary(job)}</div>
      <div className="market-progress">
        <strong>{job.bids.length} bids</strong>
        {showAcceptedCleaner && job.acceptedBid ? (
          <span>
            Accepted: {job.acceptedBid.cleaner.firstName} {job.acceptedBid.cleaner.lastName}
          </span>
        ) : (
          <span>Tap to review</span>
        )}
      </div>
    </Link>
  );
}

export function RecommendedCleanerCard({
  cleaner,
}: {
  cleaner: {
    id: string;
    firstName: string;
    lastName: string;
    cleanerProfile: {
      headline: string | null;
      hourlyRateFromCents: number | null;
      flatRateAvailable: boolean;
      serviceNeeds: ServiceNeed[];
      googleRating: number | null;
      googleReviewCount: number | null;
      licensedAndInsured: boolean;
    } | null;
  };
}) {
  return (
    <article className="market-card market-card--cleaner">
      <div className="market-avatar">{cleaner.firstName.charAt(0)}</div>
      <div className="stack small">
        <div>
          <strong>
            {cleaner.firstName} {cleaner.lastName.charAt(0)}.
          </strong>
          <div className="market-card__meta">
            {cleaner.cleanerProfile?.headline ?? "Available for residential jobs"}
          </div>
        </div>
        <div className="market-trust-row">
          <span>
            {cleaner.cleanerProfile?.googleRating
              ? `★ ${cleaner.cleanerProfile.googleRating.toFixed(1)}`
              : "New"}
          </span>
          <span>
            {cleaner.cleanerProfile?.googleReviewCount
              ? `${cleaner.cleanerProfile.googleReviewCount}+ reviews`
              : "No reviews yet"}
          </span>
          {cleaner.cleanerProfile?.licensedAndInsured ? <span>Licensed & insured</span> : null}
        </div>
        <div className="market-card__meta">
          {cleaner.cleanerProfile?.hourlyRateFromCents
            ? `From $${(cleaner.cleanerProfile.hourlyRateFromCents / 100).toFixed(0)}/hr`
            : "Rate on request"}
          {cleaner.cleanerProfile?.flatRateAvailable ? " · Flat fee available" : ""}
        </div>
      </div>
    </article>
  );
}

export function BidCard({
  bid,
  action,
  compact = false,
}: {
  bid: {
    id: string;
    pricingType: BidPricingType;
    hourlyRateCents: number | null;
    flatRateCents: number | null;
    etaMinutes: number | null;
    arrivalDate: Date | null;
    arrivalWindowStart: string | null;
    arrivalWindowEnd: string | null;
    message: string | null;
    status: BidStatus;
    cleaner: {
      firstName: string;
      lastName: string;
      cleanerProfile: {
        headline: string | null;
        googleRating: number | null;
        googleReviewCount: number | null;
        licensedAndInsured: boolean;
      } | null;
    };
    jobRequest?: {
      title: string;
      city: string;
      state: string;
    };
  };
  action?: React.ReactNode;
  compact?: boolean;
}) {
  const tone =
    bid.status === BidStatus.ACCEPTED
      ? "success"
      : bid.status === BidStatus.DECLINED || bid.status === BidStatus.WITHDRAWN
        ? "danger"
        : "default";

  return (
    <article className={compact ? "market-card market-card--bid compact" : "market-card market-card--bid"}>
      <div className="market-card__header">
        <div>
          <strong>
            {bid.cleaner.firstName} {bid.cleaner.lastName}
          </strong>
          <div className="market-card__meta">
            {bid.cleaner.cleanerProfile?.headline ?? "Available cleaner"}
          </div>
        </div>
        <StatusPill label={getBidStatusLabel(bid.status)} tone={tone} />
      </div>
      <div className="market-trust-row">
        <span>
          {bid.cleaner.cleanerProfile?.googleRating
            ? `★ ${bid.cleaner.cleanerProfile.googleRating.toFixed(1)}`
            : "New"}
        </span>
        <span>
          {bid.cleaner.cleanerProfile?.googleReviewCount
            ? `${bid.cleaner.cleanerProfile.googleReviewCount}+ Google reviews`
            : "No reviews yet"}
        </span>
        {bid.cleaner.cleanerProfile?.licensedAndInsured ? <span>Licensed & insured</span> : null}
      </div>
      {bid.message ? <p className="market-card__copy">{bid.message}</p> : null}
      {bid.jobRequest ? (
        <div className="market-card__meta">
          {bid.jobRequest.title} · {bid.jobRequest.city}, {bid.jobRequest.state}
        </div>
      ) : null}
      <div className="market-price-row">
        <span>{formatBidTiming(bid)}</span>
        <strong>{formatBidAmount(bid)}</strong>
      </div>
      {action ? <div className="market-card__actions">{action}</div> : null}
    </article>
  );
}

export function AvailableJobCard({
  job,
}: {
  job: {
    id: string;
    title: string;
    city: string;
    state: string;
    roomTypes: RoomType[];
    cleanLevel: CleanLevel;
    entryMethod: EntryMethod;
    timingPreference: TimingPreference;
    requestedDate: Date | null;
    requestedWindowStart: string | null;
    requestedWindowEnd: string | null;
    customerCompletedJobsSnapshot: number;
    customerMemberSinceSnapshot: Date | null;
    createdAt: Date;
    bids: Array<{ id: string }>;
    customer: {
      createdAt: Date;
    };
  };
}) {
  const historySummary = getCustomerHistorySummary({
    completedJobs: job.customerCompletedJobsSnapshot,
    customerCreatedAt: job.customerMemberSinceSnapshot ?? job.customer.createdAt,
  });

  return (
    <Link href={`/cleaner/jobs/${job.id}`} className="market-card market-card--job">
      <div className="market-card__header">
        <div>
          <strong>{job.title}</strong>
          <div className="market-card__meta">
            {job.city}, {job.state}
          </div>
        </div>
        <span className="market-timestamp">{formatDateLabel(job.createdAt)}</span>
      </div>
      <div className="market-card__meta">{formatRoomTypes(job.roomTypes)}</div>
      <div className="market-card__meta">{getCleanLevelLabel(job.cleanLevel)}</div>
      <div className="market-card__meta">{getEntryMethodLabel(job.entryMethod)}</div>
      <div className="market-card__meta">{formatTimingSummary(job)}</div>
      <div className="market-progress">
        <strong>{historySummary}</strong>
        <span>{job.bids.length} bids</span>
      </div>
    </Link>
  );
}
