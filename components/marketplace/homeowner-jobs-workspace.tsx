"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  ChevronDown,
  Clock3,
  Home,
  MapPin,
  Plus,
  Sparkles,
  Tag,
  UserRound,
} from "lucide-react";

import { ProviderSelectionDrawer } from "@/components/marketplace/provider-selection-drawer";

type WorkspaceBid = {
  id: string;
  pricingType: "FLAT" | "HOURLY";
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  estimatedHours: number | null;
  etaMinutes: number | null;
  arrivalDate: Date | null;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
  message: string | null;
  offerType: "FIXED_PRICE" | "ESTIMATE" | "HOURLY" | "FREE_QUOTE" | "NEEDS_DETAILS" | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  requestedScheduleAccepted: boolean | null;
  providerQuestion: string | null;
  cleaner: {
    firstName: string;
    lastName: string;
    phone: string | null;
    cleanerProfile: {
      businessName: string | null;
      googleRating: number | null;
      googleReviewCount: number | null;
    } | null;
  } | null;
  cleanerLead: {
    businessName: string | null;
    name: string | null;
    phone: string;
    googleRating: number | null;
    googleReviewCount: number | null;
  } | null;
};

type WorkspaceJob = {
  id: string;
  publicReference: string | null;
  title: string;
  city: string;
  state: string;
  postalCode: string;
  timingPreference: "ASAP" | "TIME_SLOT";
  requestedDate: Date | null;
  requestedWindowStart: string | null;
  requestedWindowEnd: string | null;
  selectionPriority: "BEST_OVERALL" | "CHEAPEST" | "FASTEST" | "BEST_QUALITY";
  status: string;
  createdAt: Date;
  entryMethod: "HIDDEN_KEY" | "DOOR_CODE" | "BUZZ_IN" | "I_WILL_BE_HOME" | "FRONT_DESK" | "OTHER";
  entryNotes: string | null;
  notes: string | null;
  bids: WorkspaceBid[];
  acceptedBid: WorkspaceBid | null;
};

type OfferSort = "best" | "lowest" | "soonest" | "rated";

const sortOptions: Array<{ label: string; value: OfferSort }> = [
  { value: "best", label: "Best match" },
  { value: "lowest", label: "Lowest price" },
  { value: "soonest", label: "Soonest available" },
  { value: "rated", label: "Highest rated" },
];

export function HomeownerJobsWorkspace({ jobs }: { jobs: WorkspaceJob[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFromUrl = searchParams.get("job");
  const [sort, setSort] = useState<OfferSort>("best");
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);

  const selectedJob =
    jobs.find((job) => job.id === selectedFromUrl) ??
    jobs[0];
  const visibleOffers = useMemo(
    () => selectedJob ? sortOffers(selectedJob.bids, sort, selectedJob.selectionPriority) : [],
    [selectedJob, sort],
  );

  useEffect(() => {
    if (!jobs.some((job) => job.status === "OPEN")) return;
    const interval = window.setInterval(() => router.refresh(), 30000);
    return () => window.clearInterval(interval);
  }, [jobs, router]);

  return (
    <div className="homeowner-jobs-workspace">
      <Link className="homeowner-jobs-workspace__create wk-pressable" href="/customer/jobs/new">
        <Plus aria-hidden="true" />
        Create new job
      </Link>

      <section className="homeowner-my-jobs" aria-labelledby="my-jobs-heading">
        <h1 id="my-jobs-heading">My Jobs</h1>
        {jobs.length > 0 ? (
          <div className="homeowner-my-jobs__list">
            {jobs.map((job) => <HomeownerJobCard job={job} key={job.id} />)}
          </div>
        ) : (
          <EmptyJobsWorkspace />
        )}
      </section>

      {selectedJob?.status === "AWARDED" && selectedJob.acceptedBid ? (
        <AcceptedProviderPanel bid={selectedJob.acceptedBid} job={selectedJob} />
      ) : selectedJob && visibleOffers.length > 0 ? (
        <section className="homeowner-offers-workspace" id="offers" aria-labelledby="offers-heading">
          <div className="homeowner-offers-workspace__heading">
            <div>
              <p className="homeowner-kicker">Compare your options</p>
              <h2 id="offers-heading">Offers received <span>{visibleOffers.length}</span></h2>
            </div>
            <label className="homeowner-offers-workspace__sort">
              <span className="sr-only">Sort offers</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as OfferSort)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" />
            </label>
          </div>

          <div className="homeowner-offers-list">
            {visibleOffers.map((bid, index) => (
              <OfferRow
                bid={bid}
                expanded={expandedBidId === bid.id}
                job={selectedJob}
                key={bid.id}
                onToggle={() => setExpandedBidId((current) => (current === bid.id ? null : bid.id))}
                recommended={index === 0 && sort === "best"}
              />
            ))}
          </div>
        </section>
      ) : null}

      {selectedJob?.status === "OPEN" && selectedJob.notes ? (
        <p className="homeowner-jobs-workspace__note">Providers can see the job details before they send an offer.</p>
      ) : null}
    </div>
  );
}

function HomeownerJobCard({ job }: { job: WorkspaceJob }) {
  const reference = job.publicReference ?? `WK-${job.id.slice(-6).toUpperCase()}`;
  const offerCount = job.bids.length;
  const isOpen = job.status === "OPEN";
  const statusLabel = job.status === "AWARDED" ? "Booked" : offerCount > 0 ? "Offers ready" : "Live";
  const attributes = getJobAttributes(job);

  return (
    <article className="homeowner-job-summary" aria-labelledby={`job-heading-${job.id}`}>
      <div className="homeowner-job-summary__intro">
        <span className="homeowner-job-summary__service-mark" aria-hidden="true"><Sparkles /></span>
        <div>
          <div className="homeowner-job-summary__title-row">
            <h2 id={`job-heading-${job.id}`}>{job.title}</h2>
            <span className={`homeowner-job-status homeowner-job-status--${statusLabel.toLowerCase().replace(" ", "-")}`}>
              {isOpen ? <i aria-hidden="true" /> : <Check aria-hidden="true" />}
              {statusLabel}
            </span>
          </div>
          <p>{formatPosted(job.createdAt)} · {getJobSupportCopy(job)}</p>
        </div>
      </div>

      <dl className="homeowner-job-summary__metadata">
        <div>
          <MapPin aria-hidden="true" />
          <dt>Location</dt>
          <dd>{job.city}, {job.state} {job.postalCode}</dd>
        </div>
        <div>
          <CalendarDays aria-hidden="true" />
          <dt>Requested time</dt>
          <dd>{formatJobTiming(job)}</dd>
        </div>
        <div>
          <Tag aria-hidden="true" />
          <dt>Job ID</dt>
          <dd>{reference}</dd>
        </div>
      </dl>

      <div className="homeowner-job-summary__attributes">
        <Home aria-hidden="true" />
        <p>{attributes.join(" · ")}</p>
      </div>

      {isOpen && offerCount === 0 ? (
        <CleanerBroadcastAnimation />
      ) : isOpen ? (
        <div className="homeowner-job-offers-summary" aria-live="polite">
          <span aria-hidden="true"><Check /></span>
          <div>
            <p>New activity</p>
            <strong>{offerCount} {offerCount === 1 ? "offer" : "offers"} received</strong>
          </div>
          <Link href={`/customer/jobs?job=${job.id}#offers`}>View offers <ChevronRight aria-hidden="true" /></Link>
        </div>
      ) : (
        <div className="homeowner-job-booked-summary">
          <span aria-hidden="true"><Check /></span>
          <div><p>Cleaner selected</p><strong>Your cleaning is booked</strong></div>
        </div>
      )}

      <Link className="homeowner-job-summary__details" href={`/customer/jobs/${job.id}`}>
        View job details <ChevronRight aria-hidden="true" />
      </Link>
    </article>
  );
}

function CleanerBroadcastAnimation() {
  return (
    <div className="homeowner-cleaner-broadcast" aria-live="polite">
      <div className="homeowner-cleaner-radar" aria-hidden="true">
        <span className="homeowner-cleaner-radar__ring homeowner-cleaner-radar__ring--one" />
        <span className="homeowner-cleaner-radar__ring homeowner-cleaner-radar__ring--two" />
        <span className="homeowner-cleaner-radar__ring homeowner-cleaner-radar__ring--three" />
        <span className="homeowner-cleaner-radar__signal homeowner-cleaner-radar__signal--one" />
        <span className="homeowner-cleaner-radar__signal homeowner-cleaner-radar__signal--two" />
        <span className="homeowner-cleaner-radar__signal homeowner-cleaner-radar__signal--three" />
        <span className="homeowner-cleaner-radar__person homeowner-cleaner-radar__person--one"><UserRound /></span>
        <span className="homeowner-cleaner-radar__person homeowner-cleaner-radar__person--two"><UserRound /></span>
        <span className="homeowner-cleaner-radar__person homeowner-cleaner-radar__person--three"><UserRound /></span>
        <span className="homeowner-cleaner-radar__center"><Sparkles /></span>
      </div>
      <div className="homeowner-cleaner-broadcast__copy">
        <span><i aria-hidden="true" /> Live now</span>
        <strong>Notifying Cleaners</strong>
        <div className="homeowner-cleaner-broadcast__dots" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </div>
  );
}

function OfferRow({
  bid,
  expanded,
  job,
  onToggle,
  recommended,
}: {
  bid: WorkspaceBid;
  expanded: boolean;
  job: WorkspaceJob;
  onToggle: () => void;
  recommended: boolean;
}) {
  const provider = getProvider(bid);
  const timing = formatBidTiming(bid);
  const offerType = formatOfferType(bid);

  return (
    <article className={`homeowner-offer${expanded ? " is-expanded" : ""}`}>
      <button className="homeowner-offer__overview" onClick={onToggle} type="button" aria-expanded={expanded}>
        <span className="homeowner-offer__avatar" aria-hidden="true">{provider.initial}</span>
        <span className="homeowner-offer__provider">
          <strong>{provider.name}</strong>
          {provider.rating ? <small>{provider.rating.toFixed(1)} <b aria-hidden="true">★</b> {provider.reviewCount ? `(${provider.reviewCount} reviews)` : ""}</small> : <small>Local cleaning provider</small>}
          <em className={bid.requestedScheduleAccepted ? "is-match" : ""}>{bid.requestedScheduleAccepted ? <Check aria-hidden="true" /> : <Clock3 aria-hidden="true" />}{timing}</em>
        </span>
        <span className="homeowner-offer__value">
          {recommended ? <small className="homeowner-offer__recommended">Best match</small> : null}
          <small className="homeowner-offer__type">{offerType}</small>
          <strong>{formatBidAmount(bid)}</strong>
        </span>
        <ChevronRight className="homeowner-offer__chevron" aria-hidden="true" />
      </button>

      {expanded ? (
        <div className="homeowner-offer__detail">
          <p>{bid.message || bid.providerQuestion || "This provider has shared their availability for your job."}</p>
          <dl>
            <div><dt>Offer</dt><dd>{formatBidAmount(bid)}</dd></div>
            <div><dt>Availability</dt><dd>{timing}</dd></div>
          </dl>
          <div className="homeowner-offer__actions">
            <Link href={`/customer/messages/${bid.id}`}>View full offer</Link>
            <ProviderSelectionDrawer
              bidId={bid.id}
              jobId={job.id}
              jobTitle={job.title}
              price={formatBidAmount(bid)}
              providerName={provider.name}
              timing={timing}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function AcceptedProviderPanel({ bid, job }: { bid: WorkspaceBid; job: WorkspaceJob }) {
  const provider = getProvider(bid);
  return (
    <section className="homeowner-accepted-provider" aria-labelledby="accepted-provider-heading">
      <div className="homeowner-accepted-provider__heading">
        <span aria-hidden="true"><Check /></span>
        <div>
          <p className="homeowner-kicker">Booked for {formatJobTiming(job)}</p>
          <h2 id="accepted-provider-heading">{provider.name} is your provider</h2>
        </div>
      </div>
      <dl>
        <div><dt>Accepted offer</dt><dd>{formatBidAmount(bid)}</dd></div>
        <div><dt>Schedule</dt><dd>{formatBidTiming(bid)}</dd></div>
      </dl>
      <div className="homeowner-accepted-provider__actions">
        <Link href={`/customer/messages/${bid.id}`}>View contact details</Link>
        <Link href={`/customer/jobs/${job.id}`}>Job details</Link>
      </div>
    </section>
  );
}

function EmptyJobsWorkspace() {
  return (
    <section className="homeowner-empty-jobs">
      <span aria-hidden="true"><Sparkles /></span>
      <p className="homeowner-kicker">Your cleaning marketplace</p>
      <h2>No active jobs</h2>
      <p>Post a cleaning request and we’ll collect offers from local providers.</p>
    </section>
  );
}

function getJobSupportCopy(job: WorkspaceJob) {
  if (job.status === "AWARDED") return "Your cleaner has been selected";
  if (job.bids.length > 0) return `${job.bids.length} ${job.bids.length === 1 ? "offer is" : "offers are"} ready to review`;
  return "Nearby cleaners are reviewing your request";
}

function getJobAttributes(job: WorkspaceJob) {
  const attributes: string[] = [];
  if (job.entryMethod === "I_WILL_BE_HOME") attributes.push("I’ll be home");
  else if (job.entryMethod !== "OTHER") attributes.push(formatEntryMethod(job.entryMethod));
  else if (job.entryNotes) attributes.push("Entry details added");
  if (job.notes) attributes.push("Notes added");
  return attributes.length > 0 ? attributes : ["Details ready for cleaners"];
}

function formatEntryMethod(method: WorkspaceJob["entryMethod"]) {
  const labels: Record<WorkspaceJob["entryMethod"], string> = {
    HIDDEN_KEY: "Hidden key",
    DOOR_CODE: "Door code",
    BUZZ_IN: "Buzz in",
    I_WILL_BE_HOME: "I’ll be home",
    FRONT_DESK: "Front desk",
    OTHER: "Entry details added",
  };
  return labels[method];
}

function getProvider(bid: WorkspaceBid) {
  const name =
    bid.cleanerLead?.businessName ||
    bid.cleaner?.cleanerProfile?.businessName ||
    bid.cleanerLead?.name ||
    (bid.cleaner ? `${bid.cleaner.firstName} ${bid.cleaner.lastName}` : null) ||
    "Local cleaning provider";
  const rating = bid.cleanerLead?.googleRating ?? bid.cleaner?.cleanerProfile?.googleRating ?? null;
  const reviewCount = bid.cleanerLead?.googleReviewCount ?? bid.cleaner?.cleanerProfile?.googleReviewCount ?? null;
  return { initial: name.charAt(0).toUpperCase(), name, rating, reviewCount };
}

function sortOffers(bids: WorkspaceBid[], sort: OfferSort, priority: WorkspaceJob["selectionPriority"]) {
  const preferenceSort: OfferSort =
    priority === "CHEAPEST" ? "lowest" : priority === "FASTEST" ? "soonest" : priority === "BEST_QUALITY" ? "rated" : "best";
  const effectiveSort = sort === "best" ? preferenceSort : sort;
  return [...bids].sort((a, b) => {
    if (effectiveSort === "lowest") return getPriceRank(a) - getPriceRank(b) || getRatingRank(b) - getRatingRank(a);
    if (effectiveSort === "soonest") return getTimingRank(a) - getTimingRank(b) || getRatingRank(b) - getRatingRank(a);
    return getRatingRank(b) - getRatingRank(a) || getTimingRank(a) - getTimingRank(b) || getPriceRank(a) - getPriceRank(b);
  });
}

function getPriceRank(bid: WorkspaceBid) {
  if (bid.offerType === "ESTIMATE") return bid.priceMinCents ?? bid.priceMaxCents ?? Number.MAX_SAFE_INTEGER;
  if (bid.pricingType === "FLAT") return bid.flatRateCents ?? Number.MAX_SAFE_INTEGER;
  if (bid.hourlyRateCents && bid.estimatedHours) return bid.hourlyRateCents * bid.estimatedHours;
  return Number.MAX_SAFE_INTEGER;
}

function getTimingRank(bid: WorkspaceBid) {
  if (bid.etaMinutes) return bid.etaMinutes;
  if (!bid.arrivalDate) return Number.MAX_SAFE_INTEGER;
  const [hours = 23, minutes = 59] = (bid.arrivalWindowStart ?? "23:59").split(":").map(Number);
  const date = new Date(bid.arrivalDate);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}

function getRatingRank(bid: WorkspaceBid) {
  return bid.cleanerLead?.googleRating ?? bid.cleaner?.cleanerProfile?.googleRating ?? 0;
}

function formatPosted(date: Date) {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60_000));
  if (diffMinutes < 1) return "Posted just now";
  if (diffMinutes < 60) return `Posted ${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `Posted ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Posted ${days}d ago`;
}

function formatJobTiming(job: Pick<WorkspaceJob, "timingPreference" | "requestedDate" | "requestedWindowStart" | "requestedWindowEnd">) {
  if (job.timingPreference === "ASAP") return "ASAP";
  if (!job.requestedDate) return "Time requested";
  const date = new Date(job.requestedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!job.requestedWindowStart) return date;
  return `${date} · ${formatClock(job.requestedWindowStart)}${job.requestedWindowEnd ? `–${formatClock(job.requestedWindowEnd)}` : ""}`;
}

function formatBidTiming(bid: Pick<WorkspaceBid, "arrivalDate" | "arrivalWindowEnd" | "arrivalWindowStart" | "etaMinutes">) {
  if (bid.etaMinutes) return `Can arrive in ${bid.etaMinutes} min`;
  if (!bid.arrivalDate || !bid.arrivalWindowStart) return "Timing shared in offer";
  const date = new Date(bid.arrivalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${date} · ${formatClock(bid.arrivalWindowStart)}${bid.arrivalWindowEnd ? `–${formatClock(bid.arrivalWindowEnd)}` : ""}`;
}

function formatClock(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatOfferType(bid: WorkspaceBid) {
  if (bid.offerType === "ESTIMATE") return "Estimate";
  if (bid.offerType === "FREE_QUOTE") return "Free quote";
  if (bid.offerType === "NEEDS_DETAILS") return "Needs details";
  if (bid.offerType === "HOURLY" || bid.pricingType === "HOURLY") return "Hourly";
  return "Fixed price";
}

function formatBidAmount(bid: WorkspaceBid) {
  if (bid.offerType === "FREE_QUOTE") return "Free quote";
  if (bid.offerType === "NEEDS_DETAILS") return "Needs details";
  if (bid.offerType === "ESTIMATE") {
    const low = bid.priceMinCents ?? bid.priceMaxCents ?? bid.flatRateCents;
    const high = bid.priceMaxCents;
    if (low && high && low !== high) return `${formatCurrency(low)}–${formatCurrency(high)}`;
    return low ? `${formatCurrency(low)} est.` : "Estimate";
  }
  if (bid.pricingType === "HOURLY") return bid.hourlyRateCents ? `${formatCurrency(bid.hourlyRateCents)}/hr` : "Hourly rate";
  return bid.flatRateCents ? formatCurrency(bid.flatRateCents) : "Price shared in offer";
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}
