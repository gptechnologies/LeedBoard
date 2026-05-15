import {
  BidPricingType,
  BidStatus,
  CleanLevel,
  EntryMethod,
  JobRequestStatus,
  PropertyType,
  RoomType,
  ServiceNeed,
  TimingPreference,
} from "@prisma/client";
import { formatCurrency, formatDateLabel, formatRelativeDate } from "@/lib/format";
import {
  formatBidAmount,
  formatEstimatedHours,
  formatBidTiming,
  formatRoomTypes,
  formatTimingSummary,
  getBidStatusLabel,
  getCleanLevelLabel,
  getCustomerHistorySummary,
  getEntryMethodLabel,
  getJobRequestStatusLabel,
  getRoomTypeIcon,
  getRoomTypeLabel,
} from "@/lib/marketplace";
import { getCleaningJobTitle } from "@/lib/job-title";
import { StatusPill } from "@/components/marketplace/status-pill";
import { Card, CardContent } from "@/components/ui/card";
import { BidCard as AppBidCard } from "@/components/marketplace/bid-card";
import { JobCard as AppJobCard } from "@/components/marketplace/job-card";
import { RippleActionLink } from "@/components/marketplace/motion-buttons";
import type { JobStatus } from "@/components/marketplace/job-status-badge";

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
    homeProfile?: {
      propertyType?: PropertyType | null;
    } | null;
  };
  href: string;
  showAcceptedCleaner?: boolean;
}) {
  return (
    <AppJobCard
      href={href}
      title={getCleaningJobTitle(job)}
      location={`${job.city}, ${job.state} ${job.postalCode}`}
      timing={formatTimingSummary(job)}
      bidCount={job.bids.length}
      status={mapJobStatus(job.status)}
      statusLabel={getJobRequestStatusLabel(job.status)}
      details={[
        formatRoomTypes(job.roomTypes),
        getCleanLevelLabel(job.cleanLevel),
        showAcceptedCleaner && job.acceptedBid
          ? `Accepted: ${job.acceptedBid.cleaner.firstName} ${job.acceptedBid.cleaner.lastName}`
          : "Tap to review",
      ].filter(Boolean)}
    />
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
    <Card className="market-card--cleaner">
      <CardContent className="flex gap-4 pt-0">
      <div className="market-avatar" aria-hidden="true">{cleaner.firstName.charAt(0)}</div>
      <div className="stack small">
        <div>
          <strong>{cleaner.firstName} {cleaner.lastName}</strong>
          <div className="market-card__meta">
            {cleaner.cleanerProfile?.headline ?? "Available for residential jobs"}
          </div>
        </div>
        <div className="market-trust-row">
          <span>
            {cleaner.cleanerProfile?.googleRating
              ? `Rating ${cleaner.cleanerProfile.googleRating.toFixed(1)}`
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
          Cleaners submit bids after you post a job.
        </div>
      </div>
      </CardContent>
    </Card>
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
    estimatedHours: number | null;
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
      homeProfile?: {
        propertyType?: PropertyType | null;
      } | null;
    };
  };
  action?: React.ReactNode;
  compact?: boolean;
}) {
  const rating = bid.cleaner.cleanerProfile?.googleRating;
  const reviewCount = bid.cleaner.cleanerProfile?.googleReviewCount;

  return (
    <AppBidCard
      className={compact ? "compact" : undefined}
      cleanerName={`${bid.cleaner.firstName} ${bid.cleaner.lastName}`}
      headline={
        bid.jobRequest
          ? `${getCleaningJobTitle(bid.jobRequest)} · ${bid.jobRequest.city}, ${bid.jobRequest.state}`
          : bid.cleaner.cleanerProfile?.headline ?? "Available cleaner"
      }
      rating={rating ? `Rating ${rating.toFixed(1)}` : "New"}
      reviewCount={reviewCount ? `${reviewCount}+ reviews` : "No reviews yet"}
      insured={bid.cleaner.cleanerProfile?.licensedAndInsured ?? false}
      message={bid.message ?? undefined}
      timing={`${formatBidTiming(bid)} · ${formatEstimatedHours(bid.estimatedHours)}`}
      amount={formatBidAmount(bid)}
      status={mapBidStatus(bid.status)}
      selected={bid.status === BidStatus.ACCEPTED}
      action={action}
    />
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
    homeProfile?: {
      propertyType?: PropertyType | null;
    } | null;
  };
}) {
  const historySummary = getCustomerHistorySummary({
    completedJobs: job.customerCompletedJobsSnapshot,
    customerCreatedAt: job.customerMemberSinceSnapshot ?? job.customer.createdAt,
  });

  return (
    <AppJobCard
      href={`/cleaner/jobs/${job.id}`}
      title={getCleaningJobTitle(job)}
      location={`${job.city}, ${job.state}`}
      timing={formatTimingSummary(job)}
      bidCount={job.bids.length}
      status="open"
      statusLabel={formatDateLabel(job.createdAt)}
      details={[
        formatRoomTypes(job.roomTypes),
        getCleanLevelLabel(job.cleanLevel),
        getEntryMethodLabel(job.entryMethod),
        historySummary,
      ]}
      variant="cleaner"
    />
  );
}

export function CleanerNearbyJobCard({
  job,
  estimateCents,
  distanceLabel,
}: {
  job: {
    id: string;
    title: string;
    serviceNeeds: ServiceNeed[];
    roomTypes: RoomType[];
    timingPreference: TimingPreference;
    requestedDate: Date | null;
    requestedWindowStart: string | null;
    requestedWindowEnd: string | null;
    homeProfile?: {
      propertyType?: PropertyType | null;
    } | null;
  };
  estimateCents: number | null;
  distanceLabel: string;
}) {
  return (
    <AppJobCard
      title={getCleaningJobTitle(job)}
      location={distanceLabel}
      timing={formatTimingSummary(job)}
      priceLabel={estimateCents ? formatWholeCurrency(estimateCents) : undefined}
      status="open"
      details={[formatRoomTypes(job.roomTypes)]}
      variant="cleaner"
      action={
        <RippleActionLink href={`/cleaner/jobs/${job.id}`}>
          Bid
        </RippleActionLink>
      }
    />
  );
}

function mapJobStatus(status: JobRequestStatus): JobStatus {
  if (status === JobRequestStatus.OPEN) return "open";
  if (status === JobRequestStatus.AWARDED) return "awarded";
  if (status === JobRequestStatus.CANCELLED) return "cancelled";
  if (status === JobRequestStatus.EXPIRED) return "expired";
  return "draft";
}

function mapBidStatus(status: BidStatus) {
  if (status === BidStatus.ACCEPTED) return "accepted";
  if (status === BidStatus.DECLINED) return "declined";
  if (status === BidStatus.WITHDRAWN) return "withdrawn";
  return "submitted";
}

function formatVisitTime(date: Date) {
  return `${formatRelativeDate(date)} · ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
  })}`;
}

function formatWholeCurrency(cents: number) {
  return formatCurrency(cents).replace(".00", "");
}

function getCleanerJobIconKind(job: {
  serviceNeeds: ServiceNeed[];
  roomTypes: RoomType[];
}) {
  if (job.serviceNeeds.includes(ServiceNeed.MOVE_OUT)) {
    return "box";
  }

  if (job.serviceNeeds.includes(ServiceNeed.KITCHEN) || job.roomTypes.includes(RoomType.KITCHEN)) {
    return "kitchen";
  }

  return "apartment";
}

function ServiceSymbol({
  kind,
  prominent = false,
}: {
  kind: string;
  prominent?: boolean;
}) {
  return (
    <span
      className={
        prominent
          ? "cleaner-service-symbol cleaner-service-symbol--prominent"
          : "cleaner-service-symbol"
      }
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24">
        {kind === "kitchen" ? (
          <>
            <path d="M7 4h10v16H7z" />
            <path d="M9 4v4h6V4" />
            <path d="M10 12h4v4h-4z" />
            <path d="M9.5 7h.01" />
            <path d="M12 7h.01" />
            <path d="M14.5 7h.01" />
          </>
        ) : null}
        {kind === "box" ? (
          <>
            <path d="m4 8 8-4 8 4-8 4z" />
            <path d="M4 8v8l8 4 8-4V8" />
            <path d="M12 12v8" />
            <path d="m16 6-8 4" />
          </>
        ) : null}
        {kind === "apartment" ? (
          <>
            <path d="M5 21V5h10v16" />
            <path d="M15 10h4v11" />
            <path d="M9 9h2" />
            <path d="M9 13h2" />
            <path d="M9 21v-4h2v4" />
          </>
        ) : null}
        {kind === "home" ? (
          <>
            <path d="m4 11 8-7 8 7" />
            <path d="M6.5 10.5V20h11v-9.5" />
            <path d="M10 20v-5h4v5" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function MetaIcon({ name }: { name: "pin" | "clock" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {name === "pin" ? (
        <>
          <path d="M12 21s6-5.3 6-11a6 6 0 0 0-12 0c0 5.7 6 11 6 11z" />
          <path d="M12 10.5h.01" />
        </>
      ) : (
        <>
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
          <path d="M12 7v5l3 2" />
        </>
      )}
    </svg>
  );
}
