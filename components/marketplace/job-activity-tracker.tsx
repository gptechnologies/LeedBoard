"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


type ActivityStatus = "OPEN" | "AWARDED" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "DELETED";

type ActivityTrackerProps = {
  bidCount: number;
  cleanersNotifiedCount: number;
  createdAt: Date;
  defaultExpanded?: boolean;
  jobId: string;
  status: ActivityStatus;
  viewCount: number;
};

export function JobActivityTracker({ bidCount, status }: ActivityTrackerProps) {
  const router = useRouter();
  const hasResponses = bidCount > 0 || status === "AWARDED" || status === "COMPLETED";
  const selected = status === "AWARDED" || status === "COMPLETED";
  const isUpdating = status === "OPEN";

  useEffect(() => {
    if (!isUpdating) return;
    const interval = window.setInterval(() => router.refresh(), 15000);
    return () => window.clearInterval(interval);
  }, [isUpdating, router]);

  return (
    <section className="wk-status-progress" aria-label="Job status">
      <div className="wk-status-progress__topline">
        <strong>
          {status === "EXPIRED" ? "Job ended" : status === "DELETED" ? "Job removed" : status === "CANCELLED" ? "Job cancelled" : selected
            ? "Provider selected"
            : hasResponses
              ? "Reviewing providers"
              : "Collecting offers"}
        </strong>
        {!hasResponses && isUpdating ? (
          <span className="wk-status-progress__waiting"><i aria-hidden="true" /> Live</span>
        ) : null}
      </div>
      {status === "OPEN" || selected ? <ol>
        <StatusStep complete={hasResponses} current={!hasResponses} label="Posted" />
        <StatusStep complete={selected} current={hasResponses && !selected} label="Offers" />
        <StatusStep complete={status === "COMPLETED"} current={selected} label="Selected" />
      </ol> : <p className="wk-status-progress__closed">This posting is no longer accepting offers.</p>}
    </section>
  );
}

function StatusStep({ complete, current, label }: { complete: boolean; current: boolean; label: string }) {
  return (
    <li className={complete ? "is-complete" : current ? "is-current" : ""}>
      <span aria-hidden="true">{complete ? <Check /> : null}</span>
      <small>{label}</small>
    </li>
  );
}
