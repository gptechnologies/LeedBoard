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
  CircleGauge,
  CircleCheck,
  Home,
  MapPin,
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
      <JobAreaSummary item={item} />
      <JobCardIntro item={item} />
      <JobCardDetails detail={detail} item={item} />
    </>
  );
}

export function JobAreaSummary({ item }: { item: NearbyJobSwipeItem }) {
  const { job } = item;

  return (
    <section
      className="wk-provider-area-summary"
      aria-label={`Job area: ${formatCity(job.city)}, ${job.state.toUpperCase()} ${job.postalCode}`}
    >
      <div className="wk-provider-area-summary__location">
        <MapPin aria-hidden="true" />
        <span>
          <small>Job area</small>
          <strong>{formatCity(job.city)}, {job.state.toUpperCase()} {job.postalCode}</strong>
        </span>
      </div>
      <div className="wk-provider-area-summary__timing">
        <CalendarDays aria-hidden="true" />
        <span><small>Requested</small><strong>{item.timingLabel}</strong></span>
      </div>
      <span className="wk-provider-area-summary__status">Open for bids</span>
    </section>
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
        {job.notes?.trim() || formatSummaryDescription(job.serviceNeeds)}
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
  const details = [
    { Icon: Sparkles, label: "Service", value: formatServiceDetail(job.serviceNeeds) },
    { Icon: Home, label: "Home type", value: formatHomeSummary(home) },
    { Icon: PawPrint, label: "Pets", value: home?.hasPets ? "Pets in home" : "No pets noted" },
    { Icon: BedDouble, label: "Bedrooms", value: home?.bedroomCount != null ? String(home.bedroomCount) : "Not provided" },
    { Icon: Bath, label: "Bathrooms", value: home?.bathroomCount != null ? formatNumber(home.bathroomCount) : "Not provided" },
    { Icon: CircleGauge, label: "Home size", value: home?.estimatedSquareFeet ? `${home.estimatedSquareFeet.toLocaleString()} ft²` : "Not provided" },
    { Icon: Home, label: "Stories", value: home?.storyCount != null ? String(home.storyCount) : "Not provided" },
    { Icon: Sparkles, label: "Supplies", value: formatSupplies(job.suppliesSource) },
  ];

  return (
    <div className="wk-provider-job-card__facts" id={`provider-job-details-${item.id}`}>
      <dl>
        {details.map(({ Icon, label, value }) => (
          <div key={label}>
            <Icon aria-hidden="true" />
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function formatServices(needs: ServiceNeed[]) {
  const labels: Record<ServiceNeed, string> = {
    GENERAL_CLEANING: "General cleaning",
    DEEP_CLEAN: "Deep cleaning",
    KITCHEN: "Kitchen cleaning",
    BATHROOMS: "Bathroom cleaning",
    FLOORS: "Floor cleaning",
    DUSTING: "Dusting",
    MOVE_OUT: "Move-out cleaning",
    WINDOWS: "Window cleaning",
    LAUNDRY: "Laundry",
  };
  return needs.length ? needs.map((need) => labels[need]).join(", ") : "Home cleaning";
}

function formatServiceDetail(needs: ServiceNeed[]) {
  if (needs.length <= 1) return formatServices(needs);
  const remaining = needs.length - 1;
  return `${formatServices(needs.slice(0, 1))} +${remaining} ${remaining === 1 ? "area" : "areas"}`;
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

function formatSupplies(value: SuppliesSource) {
  if (value === "HOMEOWNER_PROVIDES") return "Homeowner provides supplies";
  if (value === "MIXED") return "Supplies are shared";
  return "Cleaner brings supplies";
}

function formatCondition(condition: HomeCondition | null, level: CleanLevel) {
  if (condition === "NEEDS_EXTRA_ATTENTION" || level === "DEEP") return "Deep clean";
  if (condition === "LIGHT_TOUCH_UP" || level === "LIGHT") return "Light clean";
  return "Standard clean";
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toString();
}

function formatHomeSummary(home: HomeSnapshot) {
  if (!home) return "Not provided";
  const parts = [home.propertyType === "APARTMENT" ? "Apartment" : "Single family"];
  if (home.estimatedSquareFeet) parts.push(`${home.estimatedSquareFeet.toLocaleString()} ft²`);
  return parts.join(", ");
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
