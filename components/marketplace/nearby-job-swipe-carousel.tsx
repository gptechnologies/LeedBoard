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
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleGauge,
  Home,
  MapPin,
  Navigation,
  PawPrint,
  Sparkles,
} from "lucide-react";
import { useRef, useState, type TouchEvent } from "react";

import { EmptyState } from "@/components/marketplace/empty-state";
import { FastBidDrawer } from "@/components/marketplace/fast-bid-drawer";
import { PassJobAction } from "@/components/marketplace/pass-job-action";
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

export function NearbyJobSwipeCarousel({
  defaults,
  jobs,
}: {
  defaults: {
    standardHourlyRateCents: number | null;
    standardFlatRateCents: number | null;
    defaultEtaMinutes: number | null;
  };
  jobs: NearbyJobSwipeItem[];
}) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const current = jobs[index] ?? null;

  function move(direction: -1 | 1) {
    const next = Math.min(Math.max(index + direction, 0), Math.max(jobs.length - 1, 0));
    if (next !== index) {
      setIndex(next);
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
      <JobPager count={jobs.length} index={index} onMove={move} />

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
        <div className="wk-provider-job-card__actions">
          <FastBidDrawer
            defaults={defaults}
            job={current.job}
            timingLabel={current.timingLabel}
            trigger={<button className="wk-provider-primary-action wk-pressable" type="button">Bid on Job</button>}
          />
          <button
            aria-controls={`provider-job-details-${current.id}`}
            aria-expanded={expanded}
            className="wk-provider-secondary-action wk-pressable"
            onClick={toggleDetails}
            type="button"
          >
            {expanded ? "Hide Details" : "View Details"}
            {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
          </button>
          {expanded ? (
            <div className="wk-provider-expanded-actions">
              <PassJobAction jobId={current.id} />
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}

export function ProviderJobOverview({ detail = false, item }: { detail?: boolean; item: NearbyJobSwipeItem }) {
  return (
    <>
      <div className="wk-provider-job-card__topline">
        <span>{formatPostedDate(item.job.createdAt)} · {item.bidCount} {item.bidCount === 1 ? "bid" : "bids"}</span>
        <span className="wk-provider-job-condition">
          <CircleGauge aria-hidden="true" />
          {formatCondition(item.job.currentCondition, item.job.cleanLevel)}
        </span>
      </div>
      <ApproximateAreaMap job={item.job} />
      <JobCardIntro item={item} />
      <JobCardDetails detail={detail} item={item} />
    </>
  );
}

export function ApproximateAreaMap({ job }: { job: NearbyJobDeckJob }) {
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
      <span className="wk-provider-map__city">{formatCity(job.city)}</span>
      <figcaption>
        <Navigation aria-hidden="true" />
        <span><strong>{formatCity(job.city)}, {job.state.toUpperCase()} {job.postalCode}</strong>Approx. area · within 5 mi</span>
      </figcaption>
    </figure>
  );
}

function JobCardIntro({ item }: { item: NearbyJobSwipeItem }) {
  const { job } = item;
  const home = job.homeProfile;

  return (
    <div className="wk-provider-job-card__summary">
      <h2>{getCleaningJobTitle(job)}</h2>
      <div className="wk-provider-job-card__meta" aria-label="Job timing and general location">
        <span><CalendarDays aria-hidden="true" />{item.timingLabel}</span>
        <span><MapPin aria-hidden="true" />{formatCity(job.city)}, {job.state.toUpperCase()} {job.postalCode}</span>
      </div>
      <p className="wk-provider-job-card__description">
        {job.notes?.trim() || `${formatServices(job.serviceNeeds)} for a ${home?.propertyType === "APARTMENT" ? "nearby apartment" : "nearby home"}. ${formatSupplies(job.suppliesSource)}.`}
      </p>
    </div>
  );
}

function JobCardDetails({ detail, item }: { detail: boolean; item: NearbyJobSwipeItem }) {
  const { job } = item;
  const home = job.homeProfile;
  const details = [
    { Icon: Sparkles, label: "Service", value: formatServiceDetail(job.serviceNeeds) },
    { Icon: Home, label: "Home type", value: formatHomeSummary(home) },
    { Icon: PawPrint, label: "Pets", value: home?.hasPets ? "Pets in home" : "No pets noted" },
    ...(detail ? [
      { Icon: BedDouble, label: "Bedrooms", value: home?.bedroomCount != null ? String(home.bedroomCount) : "Not provided" },
      { Icon: Bath, label: "Bathrooms", value: home?.bathroomCount != null ? formatNumber(home.bathroomCount) : "Not provided" },
      { Icon: CircleGauge, label: "Home size", value: home?.estimatedSquareFeet ? `${home.estimatedSquareFeet.toLocaleString()} ft²` : "Not provided" },
      { Icon: Home, label: "Stories", value: home?.storyCount != null ? String(home.storyCount) : "Not provided" },
      { Icon: Sparkles, label: "Supplies", value: formatSupplies(job.suppliesSource) },
    ] : []),
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

function JobPager({ count, index, onMove }: { count: number; index: number; onMove: (direction: -1 | 1) => void }) {
  return (
    <nav className="wk-provider-pager" aria-label="Browse open jobs">
      <button aria-label="Previous job" disabled={index === 0} onClick={() => onMove(-1)} type="button">
        <ChevronLeft aria-hidden="true" />
      </button>
      <div aria-live="polite">
        <span>{index + 1} of {count}</span>
        <div className="wk-provider-pager__dots" aria-hidden="true">
          {Array.from({ length: Math.min(count, 7) }, (_, dot) => (
            <i className={dot === Math.min(index, 6) ? "is-active" : ""} key={dot} />
          ))}
        </div>
      </div>
      <button aria-label="Next job" disabled={index === count - 1} onClick={() => onMove(1)} type="button">
        <ChevronRight aria-hidden="true" />
      </button>
    </nav>
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

function formatPostedDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `Posted ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function formatCity(value: string) {
  return value.trim().toLocaleLowerCase("en-US").replace(/(^|[\s-])\p{L}/gu, (character) => character.toLocaleUpperCase("en-US"));
}
