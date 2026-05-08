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
import { formatCurrency, formatDateLabel, formatRelativeDate } from "@/lib/format";
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
  getRoomTypeIcon,
  getRoomTypeLabel,
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
    job.status === JobRequestStatus.OPEN
      ? "active"
      : job.status === JobRequestStatus.AWARDED
      ? "success"
      : job.status === JobRequestStatus.CANCELLED
        ? "danger"
        : job.status === JobRequestStatus.EXPIRED
          ? "warning"
          : "default";

  return (
    <Link href={href} className="market-card market-card--job">
      <div className="market-card__header">
        <div className="market-card__title-group">
          <strong>{job.title}</strong>
          <div className="market-card__meta">
            {job.city}, {job.state} {job.postalCode}
          </div>
        </div>
        <StatusPill label={getJobRequestStatusLabel(job.status)} tone={tone} />
      </div>
      <div className="market-room-symbol-row" aria-label={`Rooms: ${formatRoomTypes(job.roomTypes)}`}>
        {job.roomTypes.map((roomType) => (
          <span
            key={roomType}
            className="market-room-symbol"
            title={getRoomTypeLabel(roomType)}
          >
            {getRoomTypeIcon(roomType)}
          </span>
        ))}
      </div>
      <div className="market-card__meta">{getCleanLevelLabel(job.cleanLevel)}</div>
      <div className="market-card__meta">{formatTimingSummary(job)}</div>
      <div className="market-progress">
        <strong>{job.bids.length} {job.bids.length === 1 ? "bid" : "bids"}</strong>
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
  const rating = bid.cleaner.cleanerProfile?.googleRating;
  const reviewCount = bid.cleaner.cleanerProfile?.googleReviewCount;

  return (
    <article className={compact ? "market-card market-card--bid compact" : "market-card market-card--bid"}>
      <div className="market-card__header">
        <div className="market-bid-identity">
          <div className="market-avatar market-avatar--small" aria-hidden="true">
            {bid.cleaner.firstName.charAt(0)}
          </div>
          <div>
            <strong>
              {bid.cleaner.firstName} {bid.cleaner.lastName}
            </strong>
            <div className="market-card__meta">
              {bid.cleaner.cleanerProfile?.headline ?? "Available cleaner"}
            </div>
          </div>
        </div>
        <StatusPill label={getBidStatusLabel(bid.status)} tone={tone} />
      </div>
      <div className="market-trust-row">
        <span>
          {rating
            ? `Rating ${rating.toFixed(1)}`
            : "New"}
        </span>
        <span>
          {reviewCount
            ? `${reviewCount}+ reviews`
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
        <strong><span>Bid</span>{formatBidAmount(bid)}</strong>
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

export function CleanerUpNextCard({
  booking,
}: {
  booking: {
    id: string;
    city: string;
    state: string;
    service: {
      name: string;
    };
    slot: {
      startsAt: Date;
    };
  };
}) {
  return (
    <article className="cleaner-feature-card">
      <div className="cleaner-feature-card__heading">
        <h2>Up next (1)</h2>
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
      <div className="cleaner-feature-card__body">
        <ServiceSymbol kind="home" prominent />
        <div className="cleaner-job-card__content">
          <strong>{booking.service.name}</strong>
          <span className="cleaner-job-card__meta">
            <MetaIcon name="pin" />
            {booking.city}, {booking.state}
          </span>
          <span className="cleaner-job-card__meta">
            <MetaIcon name="clock" />
            {formatVisitTime(booking.slot.startsAt)}
          </span>
        </div>
        <Link href={`/cleaner/bookings/${booking.id}`} className="cleaner-action-button">
          Open
        </Link>
      </div>
    </article>
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
  };
  estimateCents: number | null;
  distanceLabel: string;
}) {
  return (
    <article className="cleaner-job-card">
      <ServiceSymbol kind={getCleanerJobIconKind(job)} />
      <div className="cleaner-job-card__content">
        <strong>{job.title}</strong>
        <span className="cleaner-job-card__meta">
          <MetaIcon name="pin" />
          {distanceLabel}
        </span>
        <span className="cleaner-job-card__meta">
          <MetaIcon name="clock" />
          {formatTimingSummary(job)}
        </span>
      </div>
      <div className="cleaner-job-card__bid">
        {estimateCents ? <strong>{formatWholeCurrency(estimateCents)}</strong> : null}
        <Link href={`/cleaner/jobs/${job.id}`} className="cleaner-action-button">
          Bid
        </Link>
      </div>
    </article>
  );
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
