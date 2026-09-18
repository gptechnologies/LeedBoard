"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";

import { HomeownerOpenJobsCarousel } from "@/components/marketplace/homeowner-open-jobs-carousel";
import { ProviderSelectionDrawer } from "@/components/marketplace/provider-selection-drawer";
import { JobOptionsSheet } from "@/components/marketplace/job-options-sheet";

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

export type HomeownerWorkspaceJob = {
  id: string;
  publicReference: string | null;
  title: string;
  addressLine1: string;
  addressLine2: string | null;
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

export function HomeownerJobsWorkspace({ jobs }: { jobs: HomeownerWorkspaceJob[] }) {
  const router = useRouter();

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
        <div className="homeowner-my-jobs__heading">
          <h1 id="my-jobs-heading">My jobs</h1>
        </div>

        {jobs.length > 0 ? (
          <HomeownerOpenJobsCarousel className="homeowner-my-jobs__carousel">
            {jobs.map((job) => <HomeownerJobCard job={job} key={job.id} />)}
          </HomeownerOpenJobsCarousel>
        ) : (
          <EmptyJobsWorkspace />
        )}
      </section>
    </div>
  );
}

function HomeownerJobCard({ job }: { job: HomeownerWorkspaceJob }) {
  const reference = job.publicReference ?? `WK-${job.id.slice(-6).toUpperCase()}`;
  const offers = useMemo(() => sortOffers(job.bids, job.selectionPriority), [job.bids, job.selectionPriority]);
  const [expandedBidId, setExpandedBidId] = useState<string | null>(offers[0]?.id ?? null);
  const isOpen = job.status === "OPEN";

  return (
    <div className="homeowner-job-slide">
      <p className="homeowner-job-summary__posted"><i aria-hidden="true" />{formatPosted(job.createdAt)}</p>
      <JobOptionsSheet hasBids={job.bids.length > 0} jobId={job.id} status={job.status}>
      <article className="homeowner-job-summary" aria-labelledby={`job-heading-${job.id}`}>
        <p className="homeowner-job-summary__reference">Job ID <span>{reference}</span></p>
        <header className="homeowner-job-summary__intro">
          <span className="homeowner-job-summary__service-mark" aria-hidden="true"><Sparkles /></span>
          <div>
            <h2 id={`job-heading-${job.id}`}>{formatJobTiming(job)}</h2>
            <p className="homeowner-job-summary__location">{job.city}, {job.state} {job.postalCode}</p>
          </div>
        </header>

        <dl className="homeowner-job-summary__metadata">
          <div>
            <MapPin aria-hidden="true" />
            <dt>Address</dt>
            <dd>{formatAddress(job)}</dd>
          </div>
          <div>
            <FileText aria-hidden="true" />
            <dt>Notes</dt>
            <dd>{job.notes || "No extra notes"}</dd>
          </div>
        </dl>

        <div className="homeowner-job-summary__status-area">
          {isOpen && offers.length === 0 ? (
            <CleanerBroadcastAnimation />
          ) : isOpen ? (
            <section className="homeowner-card-offers" aria-labelledby={`offers-heading-${job.id}`}>
              <div className="homeowner-card-offers__heading">
                <div>
                  <span><i aria-hidden="true" /> Live now</span>
                  <h3 id={`offers-heading-${job.id}`}>{offers.length} {offers.length === 1 ? "offer" : "offers"} ready</h3>
                </div>
                <Link href={`/customer/jobs/${job.id}/bids`}>See all <ChevronRight aria-hidden="true" /></Link>
              </div>
              <p>Cleaners are responding to your request. Compare their timing and price below.</p>
              <div className="homeowner-offers-list">
                {offers.map((bid, index) => (
                  <OfferRow
                    bid={bid}
                    expanded={expandedBidId === bid.id}
                    job={job}
                    key={bid.id}
                    onToggle={() => setExpandedBidId((value) => value === bid.id ? null : bid.id)}
                    recommended={index === 0}
                  />
                ))}
              </div>
            </section>
          ) : job.status === "EXPIRED" ? (
            <div className="homeowner-job-ended" role="status"><strong>Job ended</strong><p>No cleaner was selected before the deadline.</p><Link href={`/customer/jobs/new?repost=${job.id}`}>Post again <ChevronRight aria-hidden="true" /></Link></div>
          ) : job.acceptedBid ? (
            <AcceptedProviderPanel bid={job.acceptedBid} job={job} />
          ) : (
            <div className="homeowner-job-booked-summary">
              <span aria-hidden="true"><Check /></span>
              <div><p>Job update</p><strong>{job.status === "COMPLETED" ? "Cleaning complete" : "This job is no longer active"}</strong></div>
            </div>
          )}
        </div>
      </article>
      </JobOptionsSheet>
    </div>
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
        <strong>Notifying<br />Cleaners</strong>
        <p>We’re reaching out to nearby cleaners. You’ll see bids here soon.</p>
        <div className="homeowner-cleaner-broadcast__dots" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </div>
  );
}

function OfferRow({ bid, expanded, job, onToggle, recommended }: { bid: WorkspaceBid; expanded: boolean; job: HomeownerWorkspaceJob; onToggle: () => void; recommended: boolean }) {
  const provider = getProvider(bid);
  const timing = formatBidTiming(bid);

  return (
    <article className={`homeowner-offer${expanded ? " is-expanded" : ""}`}>
      <button className="homeowner-offer__overview" onClick={onToggle} type="button" aria-expanded={expanded}>
        <span className="homeowner-offer__avatar" aria-hidden="true">{provider.initial}</span>
        <span className="homeowner-offer__provider">
          <strong>{provider.name}</strong>
          {provider.rating ? <small>{provider.rating.toFixed(1)} <b aria-hidden="true">★</b> {provider.reviewCount ? `(${provider.reviewCount})` : ""}</small> : <small>Local cleaning provider</small>}
          <em className={bid.requestedScheduleAccepted ? "is-match" : ""}>{bid.requestedScheduleAccepted ? <Check aria-hidden="true" /> : <Clock3 aria-hidden="true" />}{timing}</em>
        </span>
        <span className="homeowner-offer__value">
          {recommended ? <small className="homeowner-offer__recommended">Best match</small> : null}
          <strong>{formatBidAmount(bid)}</strong>
        </span>
        <ChevronRight className="homeowner-offer__chevron" aria-hidden="true" />
      </button>
      {expanded ? (
        <div className="homeowner-offer__detail">
          <p>{bid.message || bid.providerQuestion || "This cleaner shared their availability for your job."}</p>
          <div className="homeowner-offer__actions">
            <Link href={`/customer/messages/${bid.id}`}>Message</Link>
            <ProviderSelectionDrawer bidId={bid.id} jobId={job.id} jobTitle={job.title} price={formatBidAmount(bid)} providerName={provider.name} timing={timing} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function AcceptedProviderPanel({ bid, job }: { bid: WorkspaceBid; job: HomeownerWorkspaceJob }) {
  const provider = getProvider(bid);
  return (
    <section className="homeowner-accepted-provider" aria-labelledby={`accepted-provider-${job.id}`}>
      <div className="homeowner-accepted-provider__main">
        <div className="homeowner-accepted-provider__heading">
          <span aria-hidden="true"><Check /></span>
          <div><p className="homeowner-kicker">Cleaner chosen</p><h3 id={`accepted-provider-${job.id}`}>{provider.name}</h3></div>
        </div>
        <div className="homeowner-accepted-provider__actions">
          <Link href={`/customer/messages/${bid.id}`}>Open conversation <ChevronRight aria-hidden="true" /></Link>
        </div>
      </div>
      <dl className="homeowner-accepted-provider__facts">
        <div><dt>Arrival</dt><dd>{formatBidTiming(bid)}</dd></div>
        <div><dt>Price</dt><dd>{formatBidAmount(bid)}</dd></div>
      </dl>
    </section>
  );
}

function EmptyJobsWorkspace() {
  return (
    <div className="homeowner-empty-jobs">
      <span aria-hidden="true"><CalendarDays /></span>
      <p className="homeowner-kicker">Your home, on your schedule</p>
      <h2>No jobs yet</h2>
      <p>Post a cleaning request and we’ll gather nearby offers here.</p>
      <Link href="/customer/jobs/new"><Plus aria-hidden="true" /> Create your first job</Link>
    </div>
  );
}

function formatAddress(job: HomeownerWorkspaceJob) {
  return [job.addressLine1, job.addressLine2, `${job.city}, ${job.state} ${job.postalCode}`].filter(Boolean).join(", ");
}

function formatPosted(createdAt: Date) {
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60_000));
  if (minutes < 1) return "Posted just now";
  if (minutes < 60) return `Posted ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Posted ${hours}h ago`;
  return `Posted ${Math.floor(hours / 24)}d ago`;
}

function formatJobTiming(job: HomeownerWorkspaceJob) {
  if (job.timingPreference === "ASAP") return "As soon as possible";
  if (!job.requestedDate || !job.requestedWindowStart || !job.requestedWindowEnd) return "Time requested";
  const date = job.requestedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${date} · ${formatClock(job.requestedWindowStart)}–${formatClock(job.requestedWindowEnd)}`;
}

function formatClock(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getProvider(bid: WorkspaceBid) {
  const name = bid.cleanerLead?.businessName || bid.cleaner?.cleanerProfile?.businessName || bid.cleanerLead?.name || (bid.cleaner ? `${bid.cleaner.firstName} ${bid.cleaner.lastName}` : "Local cleaner");
  return { initial: name.charAt(0).toUpperCase(), name, rating: bid.cleanerLead?.googleRating ?? bid.cleaner?.cleanerProfile?.googleRating ?? null, reviewCount: bid.cleanerLead?.googleReviewCount ?? bid.cleaner?.cleanerProfile?.googleReviewCount ?? null };
}

function formatBidTiming(bid: WorkspaceBid) {
  if (bid.etaMinutes) return `Can arrive in ${bid.etaMinutes} min`;
  if (!bid.arrivalDate || !bid.arrivalWindowStart) return "Timing shared in message";
  const date = bid.arrivalDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!bid.arrivalWindowEnd) return `${date} · ${formatClock(bid.arrivalWindowStart)}`;
  return `${date} · ${formatClock(bid.arrivalWindowStart)}–${formatClock(bid.arrivalWindowEnd)}`;
}

function formatBidAmount(bid: WorkspaceBid) {
  if (bid.offerType === "FREE_QUOTE") return "Free quote";
  if (bid.offerType === "NEEDS_DETAILS") return "Needs details";
  if (bid.offerType === "ESTIMATE") {
    const min = bid.priceMinCents ?? bid.flatRateCents;
    const max = bid.priceMaxCents;
    if (min && max && min !== max) return `$${Math.round(min / 100)}–$${Math.round(max / 100)}`;
    return min ? `$${Math.round(min / 100)} est.` : "Estimate";
  }
  if (bid.pricingType === "HOURLY") return `$${Math.round((bid.hourlyRateCents ?? 0) / 100)}/hr`;
  return `$${Math.round((bid.flatRateCents ?? 0) / 100)}`;
}

function sortOffers(bids: WorkspaceBid[], priority: HomeownerWorkspaceJob["selectionPriority"]) {
  return [...bids].sort((a, b) => {
    if (priority === "CHEAPEST") return getBidPrice(a) - getBidPrice(b);
    if (priority === "FASTEST") return getBidMinutes(a) - getBidMinutes(b);
    if (priority === "BEST_QUALITY") return getBidRating(b) - getBidRating(a);
    return getBidRating(b) - getBidRating(a) || getBidPrice(a) - getBidPrice(b);
  });
}

function getBidPrice(bid: WorkspaceBid) {
  if (bid.flatRateCents) return bid.flatRateCents;
  if (bid.hourlyRateCents && bid.estimatedHours) return bid.hourlyRateCents * bid.estimatedHours;
  return bid.priceMinCents ?? bid.priceMaxCents ?? Number.MAX_SAFE_INTEGER;
}

function getBidMinutes(bid: WorkspaceBid) {
  if (bid.etaMinutes) return bid.etaMinutes;
  if (!bid.arrivalDate) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.floor((bid.arrivalDate.getTime() - Date.now()) / 60_000));
}

function getBidRating(bid: WorkspaceBid) {
  return bid.cleanerLead?.googleRating ?? bid.cleaner?.cleanerProfile?.googleRating ?? 0;
}
