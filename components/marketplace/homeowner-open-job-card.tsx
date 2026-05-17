import Link from "next/link";
import type { ReactNode } from "react";
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
import {
  CleanLevel,
  JobRequestStatus,
  type PropertyType,
  RoomType,
  TimingPreference,
} from "@prisma/client";
import {
  formatTimingSummary,
  getJobRequestStatusLabel,
} from "@/lib/marketplace";
import { getCleaningJobTitle } from "@/lib/job-title";
import { JobActivityTracker } from "@/components/marketplace/job-activity-tracker";
import { Card } from "@/components/ui/card";

type HomeProfileSnapshot = {
  bedroomCount: number | null;
  bathroomCount: number | null;
  estimatedSquareFeet: number | null;
  storyCount: number | null;
  hasPets: boolean;
  propertyType?: PropertyType | null;
} | null;

type OpenJobCardJob = {
  id: string;
  title: string;
  addressLine1?: string;
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
  createdAt: Date;
  cleanersNotifiedCount: number;
  viewCount: number;
  bids: Array<{ id: string }>;
  homeProfile: HomeProfileSnapshot;
  notes?: string | null;
};

export function HomeownerOpenJobCard({ href, job }: { href: string; job: OpenJobCardJob }) {
  return (
    <Link href={href} className="customer-open-job-link">
      <HomeownerOpenJobCardContent
        action={
          <span className="customer-open-job-chevron" aria-hidden="true">
            <ChevronRight />
          </span>
        }
        includePetsInChips={false}
        showActivity
        job={job}
      />
    </Link>
  );
}

export function HomeownerOpenJobDetailCard({
  action,
  job,
}: {
  action?: ReactNode;
  job: OpenJobCardJob;
}) {
  return <HomeownerOpenJobCardContent action={action} compact job={job} />;
}

function HomeownerOpenJobCardContent({
  action,
  compact = false,
  includePetsInChips = true,
  job,
  showActivity = false,
}: {
  action?: ReactNode;
  compact?: boolean;
  includePetsInChips?: boolean;
  job: OpenJobCardJob;
  showActivity?: boolean;
}) {
  const homeDetails = getHomeDetailChips(job.homeProfile, includePetsInChips);
  const extraDetails = [
    job.notes
      ? {
          label: "Notes",
          value: job.notes,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <Card className={compact ? "customer-open-job-card customer-open-job-card--compact" : "customer-open-job-card"}>
      <div className="customer-open-job-topline">
        <span>{formatPostedLabel(job.createdAt)}</span>
        <span
          className={`customer-open-job-status${
            job.status === JobRequestStatus.OPEN ? " customer-open-job-status--active" : ""
          }`}
        >
          <span aria-hidden="true" />
          {getJobRequestStatusLabel(job.status)}
        </span>
      </div>

      <div className="customer-open-job-title-row">
        <h3>{getCleaningJobTitle(job)}</h3>
        {action}
      </div>

      <div className="customer-open-job-meta">
        <span>
          <MapPin aria-hidden="true" />
          {formatJobLocation(job)}
        </span>
        <span>
          <Clock aria-hidden="true" />
          {formatTimingSummary(job)}
        </span>
      </div>

      {!compact ? (
        <div
          className={`customer-open-job-chips${includePetsInChips ? "" : " customer-open-job-chips--summary"}`}
          aria-label="Home details"
        >
          {homeDetails.map((detail) => (
            <span key={detail.label}>
              <detail.Icon aria-hidden="true" />
              {detail.label}
            </span>
          ))}
        </div>
      ) : null}

      {extraDetails.length > 0 ? (
        <div className="customer-open-job-detail-notes">
          {extraDetails.map((detail) => (
            <div key={detail.label}>
              <strong>{detail.label}</strong>
              <p>{detail.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {showActivity ? (
        <JobActivityTracker
          bidCount={job.bids.length}
          cleanersNotifiedCount={job.cleanersNotifiedCount}
          jobId={job.id}
          status={job.status}
          viewCount={job.viewCount}
        />
      ) : null}
    </Card>
  );
}

function getHomeDetailChips(homeProfile: HomeProfileSnapshot, includePets: boolean) {
  const chips: Array<{ Icon: LucideIcon; label: string }> = [
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
  if (includePets) {
    chips.push({
      Icon: PawPrint,
      label:
        homeProfile?.hasPets === undefined ? "- Pets" : homeProfile.hasPets ? "Pets" : "No Pets",
    });
  }
  return chips;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toString();
}

function formatJobLocation(job: OpenJobCardJob) {
  return [job.addressLine1, `${job.city}, ${job.state} ${job.postalCode}`]
    .filter(Boolean)
    .join(", ");
}

function formatPostedLabel(date: Date) {
  const postedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) return `Posted ${postedDate} • just now`;
  if (diffMinutes < 60) return `Posted ${postedDate} • ${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Posted ${postedDate} • ${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `Posted ${postedDate} • ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
}
