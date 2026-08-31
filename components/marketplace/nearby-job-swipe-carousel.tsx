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
  Clock3,
  Home,
  MapPin,
  NotepadText,
  PawPrint,
  Ruler,
} from "lucide-react";
import { useRef, type ReactNode, type TouchEvent } from "react";

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

export function NearbyJobSwipeCarousel({
  footer,
  index,
  jobs,
  onIndexChange,
}: {
  footer?: ReactNode;
  index: number;
  jobs: NearbyJobSwipeItem[];
  onIndexChange: (index: number) => void;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const current = jobs[index] ?? null;

  function move(direction: -1 | 1) {
    const next = Math.min(Math.max(index + direction, 0), Math.max(jobs.length - 1, 0));
    if (next !== index) {
      onIndexChange(next);
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
        className="wk-provider-job-card"
        key={current.id}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
        tabIndex={0}
      >
        <ProviderJobOverview item={current} />
        {footer}
      </article>

    </div>
  );
}

export function ProviderJobOverview({ item }: { item: NearbyJobSwipeItem }) {
  return (
    <>
      <ApproximateAreaMap item={item} />
      <JobCardDetails item={item} />
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

function JobCardDetails({ item }: { item: NearbyJobSwipeItem }) {
  const { job } = item;
  const home = job.homeProfile;
  const homeDetails = home ? [
    { Icon: BedDouble, label: "Beds", value: home.bedroomCount != null ? formatNumber(home.bedroomCount) : "—" },
    { Icon: Bath, label: "Baths", value: home.bathroomCount != null ? formatNumber(home.bathroomCount) : "—" },
    { Icon: Ruler, label: "sq ft", value: home.estimatedSquareFeet != null ? home.estimatedSquareFeet.toLocaleString() : "—" },
    { Icon: Home, label: "Stories", value: home.storyCount != null ? formatNumber(home.storyCount) : "—" },
    { Icon: PawPrint, label: "Pets", value: home.hasPets ? "Yes" : "No" },
  ] : [];
  const homeDetailsHeadingId = `provider-home-details-${item.id}`;
  const scheduleHeadingId = `provider-date-time-${item.id}`;
  const notesHeadingId = `provider-homeowner-notes-${item.id}`;
  const requestedDateLabel = formatRequestedDate(job.requestedDate, job.timingPreference);
  const requestedTimeLabel = formatRequestedTime(job.requestedWindowStart, job.timingPreference);

  return (
    <div className="wk-provider-expanded-details">
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
      <section aria-labelledby={scheduleHeadingId} className="wk-provider-detail-section wk-provider-schedule">
        <h3 id={scheduleHeadingId}>
          <span><CalendarDays aria-hidden="true" /></span>
          Date &amp; time
        </h3>
        <dl className="wk-provider-schedule-details">
          <div>
            <CalendarDays aria-hidden="true" />
            <span><dt>Date</dt><dd>{requestedDateLabel}</dd></span>
          </div>
          <div>
            <Clock3 aria-hidden="true" />
            <span><dt>Time</dt><dd>{requestedTimeLabel}</dd></span>
          </div>
        </dl>
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

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toString();
}

function formatRequestedDate(value: Date | string | null, timingPreference: TimingPreference) {
  if (!value) return timingPreference === "ASAP" ? "Today" : "Flexible";
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatRequestedTime(value: string | null, timingPreference: TimingPreference) {
  if (!value) return timingPreference === "ASAP" ? "ASAP" : "Flexible";
  const [hourValue = "0", minute = "00"] = value.split(":");
  const hour = Number(hourValue);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function formatCity(value: string) {
  return value.trim().toLocaleLowerCase("en-US").replace(/(^|[\s-])\p{L}/gu, (character) => character.toLocaleUpperCase("en-US"));
}
