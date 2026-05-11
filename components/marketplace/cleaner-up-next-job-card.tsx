import Link from "next/link";
import {
  Bath,
  BedDouble,
  ChevronRight,
  Clock,
  MapPin,
  PawPrint,
  Ruler,
  type LucideIcon,
} from "lucide-react";
import type {
  CleanLevel,
  RoomType,
  TimingPreference,
} from "@prisma/client";

import { Card } from "@/components/ui/card";

type HomeProfileSnapshot = {
  bathroomCount: number | null;
  bedroomCount: number | null;
  estimatedSquareFeet: number | null;
  hasPets: boolean;
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
  job,
  timingLabel,
  statusLabel = "Confirmed",
}: {
  className?: string;
  job: CleanerUpNextJob;
  timingLabel: string;
  statusLabel?: string;
}) {
  const homeDetails = getHomeDetailChips(job.homeProfile);

  return (
    <Link className="cleaner-upnext-link" href={`/cleaner/jobs/${job.id}`}>
      <Card className={`cleaner-upnext-card ${className}`}>
        <div className="cleaner-upnext-card__topline">
          <span>{formatPostedLabel(job.createdAt)}</span>
          <span className="cleaner-upnext-card__status">
            <span aria-hidden="true" />
            {statusLabel}
          </span>
        </div>

        <div className="cleaner-upnext-card__title-row">
          <h3>{job.title}</h3>
          <span className="cleaner-upnext-card__chevron" aria-hidden="true">
            <ChevronRight />
          </span>
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
          {homeDetails.map((detail) => (
            <span key={detail.label}>
              <detail.Icon aria-hidden="true" />
              {detail.label}
            </span>
          ))}
        </div>
      </Card>
    </Link>
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
    {
      Icon: PawPrint,
      label:
        homeProfile?.hasPets === undefined ? "- Pets" : homeProfile.hasPets ? "Pets" : "No Pets",
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
