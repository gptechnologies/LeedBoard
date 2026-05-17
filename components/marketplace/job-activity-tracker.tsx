"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Radio, Sparkles, UsersRound } from "lucide-react";

type ActivityStatus = "OPEN" | "AWARDED" | "COMPLETED" | "CANCELLED" | "EXPIRED";

type ActivityTrackerProps = {
  bidCount: number;
  cleanersNotifiedCount: number;
  compact?: boolean;
  jobId: string;
  status: ActivityStatus;
  viewCount: number;
};

const stageLabels = [
  "Job Posted",
  "Cleaners Notified",
  "Cleaner Reviewing",
  "Bid Received",
  "Bid Accepted",
  "Home Sparkling",
];

export function JobActivityTracker({
  bidCount,
  cleanersNotifiedCount,
  compact = false,
  jobId,
  status,
  viewCount,
}: ActivityTrackerProps) {
  const router = useRouter();
  const stage = getActivityStage({ bidCount, cleanersNotifiedCount, status, viewCount });
  const progress = ((stage + 1) / stageLabels.length) * 100;
  const activityLines = useMemo(
    () => getActivityLines({ bidCount, cleanersNotifiedCount, status, viewCount }),
    [bidCount, cleanersNotifiedCount, status, viewCount],
  );
  const avatarCount = Math.min(5, Math.max(0, cleanersNotifiedCount || viewCount || bidCount));

  useEffect(() => {
    if (status !== "OPEN") return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [router, status]);

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
    <section
      className={compact ? "job-activity-tracker job-activity-tracker--compact" : "job-activity-tracker"}
      aria-label="Marketplace activity"
    >
      <div className="job-activity-tracker__header">
        <div>
          <span className="job-activity-tracker__eyebrow">Live marketplace</span>
          <strong>{stageLabels[stage]}</strong>
        </div>
        <span className={status === "OPEN" ? "job-activity-tracker__live is-updating" : "job-activity-tracker__live"}>
          {status === "OPEN" ? <Loader2 aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          {status === "OPEN" ? "Updating" : "Confirmed"}
        </span>
      </div>

      <div className="job-activity-tracker__bar" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="job-activity-tracker__stages" aria-hidden="true">
        {stageLabels.map((label, index) => (
          <span className={index <= stage ? "complete" : ""} key={label} />
        ))}
      </div>

      <div className="job-activity-tracker__body">
        <div className="job-activity-feed">
          {activityLines.map((line, index) => (
            <p className={index === 0 ? "active" : ""} key={line}>
              {index === 0 ? <Radio aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
              <span>{line}</span>
            </p>
          ))}
        </div>

        <div className="job-activity-avatars" aria-label={`${avatarCount} cleaners in activity`}>
          {Array.from({ length: avatarCount }).map((_, index) => (
            <span key={index}>{getAvatarInitial(index)}</span>
          ))}
          {avatarCount === 0 ? (
            <span>
              <UsersRound aria-hidden="true" />
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function getActivityStage(input: {
  bidCount: number;
  cleanersNotifiedCount: number;
  status: ActivityStatus;
  viewCount: number;
}) {
  if (input.status === "COMPLETED") return 5;
  if (input.status === "AWARDED") return 4;
  if (input.bidCount > 0) return 3;
  if (input.viewCount > 0) return 2;
  if (input.cleanersNotifiedCount > 0) return 1;
  return 0;
}

function getActivityLines(input: {
  bidCount: number;
  cleanersNotifiedCount: number;
  status: ActivityStatus;
  viewCount: number;
}) {
  if (input.status === "COMPLETED") {
    return ["Cleaner marked the job complete", "Home sparkling"];
  }

  if (input.status === "AWARDED") {
    return ["Bid accepted", "Job details unlocked in messages"];
  }

  const lines = ["Job has been posted"];

  if (input.cleanersNotifiedCount > 0) {
    lines.unshift(`${input.cleanersNotifiedCount} cleaners notified in your area`);
  } else {
    lines.unshift("Finding cleaners nearby...");
  }

  if (input.viewCount > 0) {
    lines.unshift(`${input.viewCount} cleaners viewed your request`);
  } else {
    lines.push("Cleaners are being notified");
  }

  if (input.bidCount > 0) {
    lines.unshift(`${input.bidCount} ${input.bidCount === 1 ? "bid" : "bids"} received`);
  } else {
    lines.push("Collecting bids");
  }

  return lines.slice(0, 4);
}

function getAvatarInitial(index: number) {
  return ["M", "J", "A", "R", "S"][index] ?? "C";
}
