"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";

type ActivityStatus = "OPEN" | "AWARDED" | "COMPLETED" | "CANCELLED" | "EXPIRED";

type ActivityTrackerProps = {
  bidCount: number;
  cleanersNotifiedCount: number;
  createdAt: Date;
  defaultExpanded?: boolean;
  jobId: string;
  status: ActivityStatus;
  viewCount: number;
};

type TimelineItem = {
  key: string;
  label: string;
  state: "active" | "complete" | "pending";
  timestamp: Date;
};

export function JobActivityTracker({
  bidCount,
  cleanersNotifiedCount,
  createdAt,
  defaultExpanded = true,
  jobId,
  status,
  viewCount,
}: ActivityTrackerProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const timeline = useMemo(
    () =>
      getTimelineItems({
        bidCount,
        cleanersNotifiedCount,
        createdAt,
        status,
        viewCount,
      }),
    [bidCount, cleanersNotifiedCount, createdAt, status, viewCount],
  );
  const isUpdating = status === "OPEN";

  useEffect(() => {
    if (!isUpdating) return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [isUpdating, router]);

  useEffect(() => {
    if (bidCount <= 0) return;

    const storageKey = `wellkept-last-bid-count-${jobId}`;
    const previousCount = Number(window.sessionStorage.getItem(storageKey) || "0");
    if (previousCount > 0 && bidCount > previousCount && "vibrate" in navigator) {
      navigator.vibrate(18);
    }
    window.sessionStorage.setItem(storageKey, String(bidCount));
  }, [bidCount, jobId]);

  return (
    <section className="job-activity-tracker" aria-label="Live activity">
      <div className="job-activity-tracker__header">
        <button
          type="button"
          className="job-activity-tracker__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDown aria-hidden="true" />
          <span>Live Activity</span>
        </button>
        <span className={isUpdating ? "job-activity-tracker__live is-updating" : "job-activity-tracker__live"}>
          {isUpdating ? <Loader2 aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          {isUpdating ? "Updating" : "Confirmed"}
        </span>
      </div>

      {expanded ? (
        <ol className="job-activity-timeline">
          {timeline.map((item) => (
            <li className={`job-activity-timeline__item ${item.state}`} key={item.key}>
              <span className="job-activity-timeline__rail" aria-hidden="true" />
              <span className="job-activity-timeline__dot" aria-hidden="true" />
              <span className="job-activity-timeline__content">
                <strong>{item.label}</strong>
                <small>{formatActivityTime(item.timestamp)}</small>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function getTimelineItems(input: {
  bidCount: number;
  cleanersNotifiedCount: number;
  createdAt: Date;
  status: ActivityStatus;
  viewCount: number;
}) {
  const createdAt = new Date(input.createdAt);
  const hasNotifiedCleaners = input.cleanersNotifiedCount > 0 || input.viewCount > 0 || input.bidCount > 0;
  const hasCleanerEngagement = input.viewCount > 0 || input.bidCount > 0;
  const hasBid = input.bidCount > 0 || input.status === "AWARDED" || input.status === "COMPLETED";
  const accepted = input.status === "AWARDED" || input.status === "COMPLETED";
  const completed = input.status === "COMPLETED";

  const chronological: Array<Omit<TimelineItem, "state"> & { done: boolean }> = [
    {
      key: "posted",
      label: "Job has been posted",
      timestamp: createdAt,
      done: true,
    },
    {
      key: "notifying",
      label: "Cleaners are being notified",
      timestamp: addMinutes(createdAt, 2),
      done: hasNotifiedCleaners,
    },
    {
      key: "notified",
      label: hasNotifiedCleaners
        ? `${Math.max(input.cleanersNotifiedCount, input.viewCount, input.bidCount)} cleaners notified in your area`
        : "Cleaners notified in your area",
      timestamp: addMinutes(createdAt, 4),
      done: hasNotifiedCleaners,
    },
    {
      key: "collecting",
      label: "Collecting bids",
      timestamp: addMinutes(createdAt, 6),
      done: hasCleanerEngagement || hasBid,
    },
    {
      key: "bid",
      label: hasBid
        ? `${input.bidCount || 1} ${input.bidCount === 1 ? "bid" : "bids"} received`
        : "Bid received",
      timestamp: addMinutes(createdAt, 8),
      done: hasBid,
    },
    {
      key: "accepted",
      label: "Bid accepted",
      timestamp: addMinutes(createdAt, 10),
      done: accepted,
    },
    {
      key: "completed",
      label: "Home sparkling",
      timestamp: addMinutes(createdAt, 12),
      done: completed,
    },
  ];

  let currentIndex = 0;
  for (let index = chronological.length - 1; index >= 0; index -= 1) {
    if (chronological[index].done) {
      currentIndex = index;
      break;
    }
  }
  const visible = chronological
    .filter((item, index) => item.done || index === currentIndex + 1)
    .slice(-4)
    .reverse();

  return visible.map((item, index) => ({
    key: item.key,
    label: item.label,
    timestamp: item.timestamp,
    state: index === 0 ? "active" : item.done ? "complete" : "pending",
  }));
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function formatActivityTime(date: Date) {
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const dayLabel = sameDay
    ? "Today"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${dayLabel} • ${timeLabel}`;
}
