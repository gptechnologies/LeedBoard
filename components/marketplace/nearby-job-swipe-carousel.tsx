"use client";

import type {
  CleanLevel,
  HomeCondition,
  JobCleanType,
  JobRequestStatus,
  PropertyType,
  RoomType,
  ServiceNeed,
  SuppliesSource,
  TimingPreference,
} from "@prisma/client";
import {
  Bath,
  BedDouble,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Home,
  MapPin,
  NotepadText,
  PawPrint,
  Ruler,
  Sparkles,
} from "lucide-react";
import { useRef, useState, type TouchEvent } from "react";

import { EmptyState } from "@/components/marketplace/empty-state";
import { getCleaningJobTitle } from "@/lib/job-title";
import { triggerHaptic } from "@/lib/haptics";

type HomeSnapshot = {
  bathroomCount: number | null;
  bedroomCount: number | null;
  estimatedSquareFeet: number | null;
  hasPets: boolean;
  propertyType: PropertyType | null;
  storyCount: number | null;
} | null;

export type NearbyJobDeckJob = {
  city: string;
  cleanLevel: CleanLevel;
  cleanType: JobCleanType | null;
  createdAt: Date;
  currentCondition: HomeCondition | null;
  homeProfile: HomeSnapshot;
  id: string;
  notes: string | null;
  postalCode: string;
  requestedDate: Date | null;
  requestedWindowEnd: string | null;
  requestedWindowStart: string | null;
  roomTypes: RoomType[];
  serviceNeeds: ServiceNeed[];
  state: string;
  status: JobRequestStatus;
  suppliesSource: SuppliesSource;
  timingPreference: TimingPreference;
  title: string;
};

export type NearbyJobSwipeItem = {
  areaLabel: string;
  bathroomCount: number | null;
  bedroomCount: number | null;
  bidCount: number;
  estimatedSquareFeet: number | null;
  id: string;
  job: NearbyJobDeckJob;
  timingLabel: string;
  title: string;
};

const expandSwipeThreshold = 96;

export function NearbyJobSwipeCarousel({
  index,
  jobs,
  onIndexChange,
}: {
  index: number;
  jobs: NearbyJobSwipeItem[];
  onIndexChange: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const current = jobs[index] ?? null;

  function move(direction: -1 | 1) {
    const next = Math.min(Math.max(index + direction, 0), Math.max(jobs.length - 1, 0));
    if (next !== index) {
      onIndexChange(next);
      setExpanded(false);
      triggerHaptic("light");
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch) return;

    const horizontalDistance = touch.clientX - start.x;
    const verticalDistance = touch.clientY - start.y;

    if (
      verticalDistance <= -expandSwipeThreshold
      && Math.abs(verticalDistance) > Math.abs(horizontalDistance)
    ) {
      if (!expanded) {
        setExpanded(true);
        triggerHaptic("selection");
      }
      return;
    }

    if (Math.abs(horizontalDistance) < 64 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return;
    move(horizontalDistance < 0 ? 1 : -1);
  }

  function toggleDetails() {
    setExpanded((value) => !value);
    triggerHaptic("selection");
  }

  if (!current) {
    return (
      <EmptyState
        body="New jobs in your service area will appear here as soon as they are posted."
        title="You’re all caught up"
      />
    );
  }

  return (
    <div className="wk-provider-deck">
      <article
        aria-label={`${getCleaningJobTitle(current.job)}, job ${index + 1} of ${jobs.length}`}
        className={`wk-provider-job-card${expanded ? " is-expanded" : ""}`}
        key={current.id}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
        tabIndex={0}
      >
        <ProviderJobOverview detail={expanded} item={current} />
        <button
          aria-controls={`provider-job-details-${current.id}`}
          aria-expanded={expanded}
          className="wk-provider-details-toggle wk-pressable"
          onClick={toggleDetails}
          type="button"
        >
          <span>{expanded ? "Hide details" : "Show details"}</span>
          <ChevronDown aria-hidden="true" />
        </button>
      </article>

    </div>
  );
}

export function ProviderJobOverview({ detail = false, item }: { detail?: boolean; item: NearbyJobSwipeItem }) {
  return (
    <>
      <div className="wk-provider-job-card__strip">
        <Sparkles aria-hidden="true" />
        <span>{getCleaningJobTitle(item.job)} - Posted <time dateTime={new Date(item.job.createdAt).toISOString()}>{formatPostedAge(item.job.createdAt)}</time></span>
      </div>
      <ApproximateAreaMap item={item} />
      <JobCardIntro item={item} />
      <JobCardDetails detail={detail} item={item} />
    </>
  );
}

export function ApproximateAreaMap({ item }: { item: NearbyJobSwipeItem }) {
  const { job } = item;
  const hash = Array.from(`${job.city}${job.postalCode}`).reduce((total, character) => total + character.charCodeAt(0), 0);
  const markerX = 42 + (hash % 17);
  const markerY = 43 + (hash % 13);

  return (
    <figure className="wk-provider-map" aria-label={`Approximate service area near ${formatCity(job.city)}, ${job.state.toUpperCase()} ${job.postalCode}, within five miles`}>
      <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 520 230">
        <rect className="wk-provider-map__land" height="230" width="520" />
        <path className="wk-provider-map__park" d="M326 -10c42 40 101 20 128 62 31 49 4 93 56 121v67H331c-24-34-18-67 1-94 20-31 1-52-18-78-14-20-8-55 12-78Z" />
        <path className="wk-provider-map__water" d="M79-12c-5 41-28 57-22 98 7 48 43 67 31 144" />
        <path className="wk-provider-map__road-major" d="M-18 167C78 132 129 153 214 125c84-27 127-63 226-55 39 3 68 14 99 28" />
        <path className="wk-provider-map__road" d="M18 33c91 16 165 5 252 29 70 19 130 6 237-7M28 211c86-59 142-65 219-56 94 11 135 54 267 23M141-10c-8 75 11 120 2 250M270-10c15 51-5 102 10 158 7 27 29 54 33 92M433-8c-28 51-30 101-10 147 15 34 4 69-4 101" />
        <circle className="wk-provider-map__radius" cx={`${markerX}%`} cy={`${markerY}%`} r="64" />
        <circle className="wk-provider-map__marker-ring" cx={`${markerX}%`} cy={`${markerY}%`} r="13" />
        <circle className="wk-provider-map__marker" cx={`${markerX}%`} cy={`${markerY}%`} r="7" />
      </svg>
      <span className="wk-provider-map__price">$140–$170</span>
      <span className="wk-provider-map__timing"><CalendarDays aria-hidden="true" />{item.timingLabel}</span>
      <figcaption>
        <MapPin aria-hidden="true" />
        <span><strong>{formatCity(job.city)}, {job.state.toUpperCase()} {job.postalCode}</strong>Approx. area · within 5 mi</span>
      </figcaption>
    </figure>
  );
}

function JobCardIntro({ item }: { item: NearbyJobSwipeItem }) {
  const { job } = item;
  const home = job.homeProfile;
  const facts = [
    home?.bedroomCount != null
      ? { Icon: BedDouble, label: formatCount(home.bedroomCount, "Beds") }
      : null,
    home?.bathroomCount != null
      ? { Icon: Bath, label: formatCount(home.bathroomCount, "Baths") }
      : null,
    home?.estimatedSquareFeet
      ? { Icon: Ruler, label: `${home.estimatedSquareFeet.toLocaleString()} ft²` }
      : null,
    home ? { Icon: PawPrint, label: home.hasPets ? "Pets" : "No pets" } : null,
  ].filter((fact): fact is { Icon: typeof BedDouble; label: string } => fact !== null);

  return (
    <div className="wk-provider-job-card__summary">
      <div className="wk-provider-job-card__heading">
        <h2>{formatCity(job.city)}, {job.state.toUpperCase()} {job.postalCode}</h2>
        <span className="wk-provider-job-condition">
          <CircleCheck aria-hidden="true" />
          {formatCondition(job.currentCondition, job.cleanLevel)}
        </span>
      </div>
      <p className="wk-provider-job-card__description">
        {formatSummaryDescription(job.serviceNeeds)}
      </p>
      {facts.length ? (
        <div className="wk-provider-job-card__chips" aria-label="Job summary">
          {facts.map(({ Icon, label }) => (
            <span key={label}><Icon aria-hidden="true" />{label}</span>
          ))}
        </div>
      ) : (
        <p className="wk-provider-job-card__missing-details">Home details were not provided.</p>
      )}
    </div>
  );
}

function JobCardDetails({ detail, item }: { detail: boolean; item: NearbyJobSwipeItem }) {
  if (!detail) return null;

  const { job } = item;
  const home = job.homeProfile;
  const homeDetails = [
    home?.bedroomCount != null
      ? { Icon: BedDouble, label: "Bedrooms", value: formatNumber(home.bedroomCount) }
      : null,
    home?.bathroomCount != null
      ? { Icon: Bath, label: "Bathrooms", value: formatNumber(home.bathroomCount) }
      : null,
    home?.estimatedSquareFeet != null
      ? { Icon: Ruler, label: "Home size", value: `${home.estimatedSquareFeet.toLocaleString()} sq ft` }
      : null,
    home?.storyCount != null
      ? { Icon: Home, label: "Stories", value: formatNumber(home.storyCount) }
      : null,
    home
      ? { Icon: PawPrint, label: "Pets", value: home.hasPets ? "Pets" : "No pets" }
      : null,
  ].filter((entry): entry is { Icon: typeof BedDouble; label: string; value: string } => entry !== null);
  const homeDetailsHeadingId = `provider-home-details-${item.id}`;
  const notesHeadingId = `provider-homeowner-notes-${item.id}`;

  return (
    <div className="wk-provider-expanded-details" id={`provider-job-details-${item.id}`}>
      <section aria-labelledby={homeDetailsHeadingId} className="wk-provider-detail-section">
        <h3 id={homeDetailsHeadingId}>
          <span><Home aria-hidden="true" /></span>
          Home details
        </h3>
        {homeDetails.length ? (
          <dl className="wk-provider-home-details">
            {homeDetails.map(({ Icon, label, value }) => (
              <div key={label}>
                <span className="wk-provider-home-detail__icon"><Icon aria-hidden="true" /></span>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="wk-provider-detail-empty">No home details were provided.</p>
        )}
      </section>
      <section aria-labelledby={notesHeadingId} className="wk-provider-detail-section wk-provider-notes">
        <h3 id={notesHeadingId}>
          <span><NotepadText aria-hidden="true" /></span>
          Homeowner notes
        </h3>
        <p>{job.notes?.trim() || "No additional notes provided."}</p>
      </section>
    </div>
  );
}

function formatSummaryDescription(needs: ServiceNeed[]) {
  if (!needs.length) return "Home cleaning details provided by the homeowner.";
  const labels: Record<ServiceNeed, string> = {
    GENERAL_CLEANING: "general cleaning",
    DEEP_CLEAN: "deep cleaning",
    KITCHEN: "kitchen",
    BATHROOMS: "bathrooms",
    FLOORS: "floors",
    DUSTING: "dusting",
    MOVE_OUT: "move-out cleaning",
    WINDOWS: "windows",
    LAUNDRY: "laundry",
  };
  const summary = formatNaturalList(needs.slice(0, 4).map((need) => labels[need]));
  return `${summary}.`.replace(/^./, (character) => character.toLocaleUpperCase("en-US"));
}

function formatNaturalList(values: string[]) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return values.join(" and ");
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function formatCondition(condition: HomeCondition | null, level: CleanLevel) {
  if (condition === "NEEDS_EXTRA_ATTENTION" || level === "DEEP") return "Deep clean";
  if (condition === "LIGHT_TOUCH_UP" || level === "LIGHT") return "Light clean";
  return "Standard clean";
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toString();
}

function formatCount(value: number, unit: string) {
  return `${formatNumber(value)} ${unit}`;
}

function formatPostedAge(value: Date | string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (elapsedSeconds < 60) return "just now";

  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(days / 365)}y ago`;
}

function formatCity(value: string) {
  return value.trim().toLocaleLowerCase("en-US").replace(/(^|[\s-])\p{L}/gu, (character) => character.toLocaleUpperCase("en-US"));
}
