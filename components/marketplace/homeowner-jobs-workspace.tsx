"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Tag,
} from "lucide-react";

import { HomeownerOpenJobsCarousel } from "@/components/marketplace/homeowner-open-jobs-carousel";
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
  const [fallbackJobId, setFallbackJobId] = useState(jobs[0]?.id ?? "");
  const [sort, setSort] = useState<OfferSort>("best");
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);

  const selectedJob =
    jobs.find((job) => job.id === selectedFromUrl) ??
    jobs.find((job) => job.id === fallbackJobId) ??
    jobs[0];
  const visibleOffers = useMemo(
    () => selectedJob ? sortOffers(selectedJob.bids, sort, selectedJob.selectionPriority) : [],
    [selectedJob, sort],
  );

  function selectJob(id: string) {
    setFallbackJobId(id);
    setExpandedBidId(null);
    router.replace(`/customer/jobs?job=${id}`, { scroll: false });
  }

  if (!selectedJob) {
    return <EmptyJobsWorkspace />;
  }

  const isOpen = selectedJob.status === "OPEN";

  return (
    <div className="homeowner-jobs-workspace">
      <Link className="homeowner-jobs-workspace__create wk-pressable" href="/customer/jobs/new">
        <Plus aria-hidden="true" />
        Create new job
      </Link>

      <ActiveJobPicker jobs={jobs} selectedId={selectedJob.id} onSelect={selectJob} />

      <SelectedJobSummary job={selectedJob} />

      {selectedJob.status === "AWARDED" && selectedJob.acceptedBid ? (
        <AcceptedProviderPanel bid={selectedJob.acceptedBid} job={selectedJob} />
      ) : visibleOffers.length > 0 ? (
        <section className="homeowner-offers-workspace" aria-labelledby="offers-heading">
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
      ) : (
        <CollectingOffersState job={selectedJob} />
      )}

      {isOpen && selectedJob.notes ? (
        <p className="homeowner-jobs-workspace__note">Providers can see the job details before they send an offer.</p>
      ) : null}
    </div>
  );
}

function ActiveJobPicker({
  jobs,
  selectedId,
  onSelect,
}: {
  jobs: WorkspaceJob[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (jobs.length === 1) return null;

  const selectedIndex = Math.max(0, jobs.findIndex((job) => job.id === selectedId));

  return (
    <section className="homeowner-job-picker" aria-label="Active jobs">
      <p>{selectedIndex + 1} of {jobs.length} active jobs</p>
      <HomeownerOpenJobsCarousel
        className="homeowner-job-picker__carousel"
        initialIndex={selectedIndex}
        onSelectionChange={(index) => onSelect(jobs[index]?.id ?? selectedId)}
      >
        {jobs.map((job) => (
          <button
            className={`homeowner-job-picker__card${job.id === selectedId ? " is-selected" : ""}`}
            key={job.id}
            onClick={() => onSelect(job.id)}
            type="button"
          >
            <span className="homeowner-job-picker__card-icon" aria-hidden="true"><Sparkles /></span>
            <span>
              <strong>{job.title}</strong>
              <small>{job.status === "AWARDED" ? "Provider selected" : job.bids.length > 0 ? `${job.bids.length} offers to review` : "Collecting offers"}</small>
            </span>
            <ChevronRight aria-hidden="true" />
          </button>
        ))}
      </HomeownerOpenJobsCarousel>
    </section>
  );
}

function SelectedJobSummary({ job }: { job: WorkspaceJob }) {
  const reference = job.publicReference ?? `WK-${job.id.slice(-6).toUpperCase()}`;

  return (
    <section className="homeowner-job-summary" aria-labelledby="selected-job-heading">
      <div className="homeowner-job-summary__intro">
        <span className="homeowner-job-summary__service-mark" aria-hidden="true"><Sparkles /></span>
        <div>
          <h1 id="selected-job-heading">{job.title}</h1>
          <p>{formatPosted(job.createdAt)} · {job.status === "AWARDED" ? "Provider selected" : job.bids.length > 0 ? "Offers ready" : "Collecting offers"}</p>
        </div>
        {job.status === "OPEN" ? (
          <span className="homeowner-job-summary__edit-tag" aria-label="Edit job is coming soon"><Pencil aria-hidden="true" /> Edit job</span>
        ) : null}
      </div>

      <dl className="homeowner-job-summary__metadata">
        <div>
          <MapPin aria-hidden="true" />
          <dt>Location</dt>
          <dd>{job.city}, {job.state} {job.postalCode}</dd>
        </div>
        <div>
          <CalendarDays aria-hidden="true" />
          <dt>Requested</dt>
          <dd>{formatJobTiming(job)}</dd>
        </div>
        <div>
          <Tag aria-hidden="true" />
          <dt>Job ID</dt>
          <dd>{reference}</dd>
        </div>
      </dl>

      <Link className="homeowner-job-summary__details" href={`/customer/jobs/${job.id}`}>
        Job details <ChevronRight aria-hidden="true" />
      </Link>
    </section>
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

function CollectingOffersState({ job }: { job: WorkspaceJob }) {
  return (
    <section className="homeowner-collecting-offers" aria-live="polite">
      <span aria-hidden="true"><Sparkles /></span>
      <div>
        <p className="homeowner-kicker">Job posted</p>
        <h2>Finding providers</h2>
        <p>We’re collecting availability and pricing for this job. New offers will appear here.</p>
      </div>
      <strong>0 offers received</strong>
      <Link href={`/customer/jobs/${job.id}`}>View job details <ChevronRight aria-hidden="true" /></Link>
    </section>
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
      <h1>No active jobs</h1>
      <p>Post a cleaning request and we’ll collect offers from local providers.</p>
      <Link className="wk-pressable" href="/customer/jobs/new"><Plus aria-hidden="true" /> Create new job</Link>
    </section>
  );
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
