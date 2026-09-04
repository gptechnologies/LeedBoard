import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, MapPin } from "lucide-react";
import {
  CleanLevel,
  BidSelectionPriority,
  HomeCondition,
  JobCleanType,
  JobPriorityArea,
  JobRequestStatus,
  type PropertyType,
  RoomType,
  TimingPreference,
} from "@prisma/client";
import {
  formatTimingSummary,
  getBidSelectionPriorityLabel,
  getHomeConditionLabel,
  getJobCleanTypeLabel,
  getJobPriorityAreaLabel,
  getJobRequestStatusLabel,
} from "@/lib/marketplace";
import { getCleaningJobTitle } from "@/lib/job-title";
import { JobActivityTracker } from "@/components/marketplace/job-activity-tracker";
import { Card } from "@/components/ui/card";

type CustomerJobCardMode = "full" | "summary";

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
  cleanType?: JobCleanType | null;
  currentCondition?: HomeCondition | null;
  matchingPriorityAreas?: JobPriorityArea[];
  selectionPriority?: BidSelectionPriority;
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
    <Link href={href} className="customer-job-card-link">
      <HomeownerOpenJobCardContent job={job} mode="full" />
    </Link>
  );
}

export function HomeownerJobSummaryCard({
  href,
  job,
}: {
  href: string;
  job: OpenJobCardJob;
}) {
  return (
    <Link href={href} className="customer-job-card-link">
      <HomeownerOpenJobCardContent job={job} mode="summary" />
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
  return <HomeownerOpenJobCardContent action={action} job={job} mode="full" />;
}

function HomeownerOpenJobCardContent({
  action,
  job,
  mode,
}: {
  action?: ReactNode;
  job: OpenJobCardJob;
  mode: CustomerJobCardMode;
}) {
  const showActivity = mode === "full";
  const extraDetails = [
    job.cleanType
      ? {
          label: "Clean type",
          value: getJobCleanTypeLabel(job.cleanType),
        }
      : null,
    job.currentCondition
      ? {
          label: "Condition",
          value: getHomeConditionLabel(job.currentCondition),
        }
      : null,
    job.matchingPriorityAreas && job.matchingPriorityAreas.length > 0
      ? {
          label: "Priority areas",
          value: job.matchingPriorityAreas.map(getJobPriorityAreaLabel).join(", "),
        }
      : null,
    job.selectionPriority
      ? {
          label: "Most important",
          value: getBidSelectionPriorityLabel(job.selectionPriority),
        }
      : null,
    job.notes
      ? {
          label: "Notes",
          value: job.notes,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <Card className={`customer-job-card customer-job-card--${mode}`}>
      <div className="customer-job-card__topline">
        <span>{formatPostedLabel(job.createdAt)}</span>
        <span
          className={`customer-job-card__status${
            job.status === JobRequestStatus.OPEN ? " customer-job-card__status--active" : ""
          }`}
        >
          <span aria-hidden="true" />
          {getCustomerJobStatusLabel(job.status)}
        </span>
      </div>

      <div className="customer-job-card__title-row">
        <h3>{getCleaningJobTitle(job)}</h3>
        {action ? <div className="customer-job-card__action">{action}</div> : null}
      </div>

      <div className="customer-job-card__meta">
        <span>
          <MapPin aria-hidden="true" />
          {formatJobLocation(job)}
        </span>
        <span>
          <Clock aria-hidden="true" />
          {formatTimingSummary(job)}
        </span>
      </div>

      {mode === "full" && extraDetails.length > 0 ? (
        <div className="customer-job-card__notes">
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
          createdAt={job.createdAt}
          jobId={job.id}
          status={job.status}
          viewCount={job.viewCount}
        />
      ) : null}
    </Card>
  );
}

function getCustomerJobStatusLabel(status: JobRequestStatus) {
  if (status === JobRequestStatus.OPEN) return "Collecting Offers";
  if (status === JobRequestStatus.AWARDED) return "Cleaner Selected";
  if (status === JobRequestStatus.COMPLETED) return "Completed";
  if (status === JobRequestStatus.CANCELLED) return "Cancelled";
  if (status === JobRequestStatus.EXPIRED) return "Expired";
  return getJobRequestStatusLabel(status);
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
