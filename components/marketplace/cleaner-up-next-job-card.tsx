import Link from "next/link";
import {
  Bath,
  BedDouble,
  Clock,
  MapPin,
  Ruler,
} from "lucide-react";
import type {
  CleanLevel,
  PropertyType,
  RoomType,
  TimingPreference,
} from "@prisma/client";

import { Card } from "@/components/ui/card";
import { getCleaningJobTitle } from "@/lib/job-title";

type HomeProfileSnapshot = {
  bathroomCount: number | null;
  bedroomCount: number | null;
  estimatedSquareFeet: number | null;
  hasPets: boolean;
  propertyType?: PropertyType | null;
  storyCount: number | null;
} | null;

export type CleanerUpNextJob = {
  city: string;
  cleanLevel: CleanLevel;
  createdAt: Date;
  homeProfile: HomeProfileSnapshot;
  id: string;
  requestedDate: Date | null;
  requestedWindowEnd: string | null;
  requestedWindowStart: string | null;
  roomTypes: RoomType[];
  state: string;
  timingPreference: TimingPreference;
  title: string;
};

export function CleanerUpNextJobCard({
  className = "",
  href,
  job,
  showBidCta = false,
  timingLabel,
  statusLabel,
}: {
  className?: string;
  href: string;
  job: CleanerUpNextJob;
  showBidCta?: boolean;
  timingLabel: string;
  statusLabel?: string;
}) {
  const homeDetails = getHomeDetailChips(job.homeProfile);

  return (
    <Link className="cleaner-upnext-link" href={href}>
      <CleanerUpNextJobCardContent
        className={className}
        homeDetails={homeDetails}
        job={job}
        showBidCta={showBidCta}
        statusLabel={statusLabel}
        timingLabel={timingLabel}
      />
    </Link>
  );
}

export function CleanerUpNextJobCardContent({
  className = "",
  homeDetails,
  job,
  showBidCta = false,
  statusLabel,
  timingLabel,
}: {
  className?: string;
  homeDetails?: ReturnType<typeof getHomeDetailChips>;
  job: CleanerUpNextJob;
  showBidCta?: boolean;
  statusLabel?: string;
  timingLabel: string;
}) {
  const details = homeDetails ?? getHomeDetailChips(job.homeProfile);

  return (
    <Card
      className={`cleaner-upnext-card ${showBidCta ? "" : "cleaner-upnext-card--thread"} ${className}`}
    >
      <div className="cleaner-upnext-card__body">
        <CleanerUpNextJobCardBody
          homeDetails={details}
          job={job}
          statusLabel={statusLabel}
          timingLabel={timingLabel}
        />
      </div>

      {showBidCta ? (
        <span className="cleaner-upnext-card__bid-cta" aria-hidden="true">Bid</span>
      ) : null}
    </Card>
  );
}

export function CleanerUpNextJobCardBody({
  homeDetails,
  job,
  statusLabel,
  timingLabel,
}: {
  homeDetails?: ReturnType<typeof getHomeDetailChips>;
  job: CleanerUpNextJob;
  statusLabel?: string;
  timingLabel: string;
}) {
  const details = homeDetails ?? getHomeDetailChips(job.homeProfile);

  return (
    <>
      <div className="cleaner-upnext-card__topline">
        <span>{formatPostedLabel(job.createdAt)}</span>
        {statusLabel ? (
          <span className="cleaner-upnext-card__status">
            <span aria-hidden="true" />
            {statusLabel}
          </span>
        ) : null}
      </div>

      <div className="cleaner-upnext-card__title-row">
        <h3>{getCleaningJobTitle(job)}</h3>
      </div>

      <div className="cleaner-upnext-card__meta">
        <span>
          <MapPin aria-hidden="true" />
          {job.city}, {job.state}
        </span>
        <span>
          <Clock aria-hidden="true" />
          {timingLabel}
        </span>
      </div>

      <div className="cleaner-upnext-card__chips" aria-label="Home details">
        {details.map((detail) => (
          <span key={detail.label}>
            <detail.Icon aria-hidden="true" />
            {detail.label}
          </span>
        ))}
      </div>
    </>
  );
}

function getHomeDetailChips(homeProfile: HomeProfileSnapshot) {
  return [
    {
      Icon: BedDouble,
      label:
        homeProfile?.bedroomCount !== null && homeProfile?.bedroomCount !== undefined
          ? `${homeProfile.bedroomCount} Bed`
          : "- Bed",
    },
    {
      Icon: Bath,
      label:
        homeProfile?.bathroomCount !== null && homeProfile?.bathroomCount !== undefined
          ? `${formatNumber(homeProfile.bathroomCount)} Bath`
          : "- Bath",
    },
    {
      Icon: Ruler,
      label:
        homeProfile?.estimatedSquareFeet !== null && homeProfile?.estimatedSquareFeet !== undefined
          ? `${homeProfile.estimatedSquareFeet} Sq Ft`
          : "- Sq Ft",
    },
  ];
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toString();
}

function formatPostedLabel(date: Date) {
  const postedDate = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) return `Posted ${postedDate} - just now`;
  if (diffMinutes < 60) return `Posted ${postedDate} - ${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Posted ${postedDate} - ${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `Posted ${postedDate} - ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
}
