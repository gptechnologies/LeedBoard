"use client";

import { useEffect, useState } from "react";

import {
  formatBidReceivedAge,
  formatSubmittedArrivalTime,
  getEstimatedCompletionTime,
} from "@/lib/bid-summary";

export function BidReceivedTime({ createdAt }: { createdAt: Date }) {
  const [relativeTime, setRelativeTime] = useState(() => formatBidReceivedAge(createdAt));
  const timestamp = createdAt.getTime();

  useEffect(() => {
    const refresh = () => setRelativeTime(formatBidReceivedAge(createdAt));
    refresh();
    const interval = window.setInterval(refresh, 60000);
    return () => window.clearInterval(interval);
  }, [createdAt, timestamp]);

  return <time className="wk-bid-received-time" dateTime={createdAt.toISOString()}>Bid received · {relativeTime}</time>;
}

export function BidSummary({
  cleanerName,
  jobId,
  address,
  jobDate,
  arrivalTime,
  estimatedHours,
  priceLabel,
  estimatedTotal,
}: {
  cleanerName: string;
  jobId: string;
  address: string;
  jobDate: Date | null;
  arrivalTime: string | null;
  estimatedHours: number | null;
  priceLabel: string;
  estimatedTotal: string | null;
}) {
  const arrival = formatSubmittedArrivalTime(arrivalTime) ?? "—";
  const completion = getEstimatedCompletionTime(arrivalTime, estimatedHours) ?? "—";
  const date = jobDate?.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }) ?? "—";
  const hours = estimatedHours ? `Est. ${formatHours(estimatedHours)} hr${estimatedHours === 1 ? "" : "s"}` : "Est. time —";

  return (
    <section className="wk-bid-summary" aria-label="Bid summary">
      <div className="wk-bid-summary__details">
        <div className="wk-bid-summary__identity">
          <strong>{cleanerName}</strong>
          <span>Job ID: {jobId}</span>
          <p>{address}</p>
        </div>
        <dl className="wk-bid-summary__schedule">
          <div><dt>Date:</dt><dd>{date}</dd></div>
          <div><dt>Est. arrival:</dt><dd>{arrival}</dd></div>
          <div><dt>Est. completion:</dt><dd>{completion}</dd></div>
        </dl>
      </div>
      <div className="wk-bid-summary__pricing">
        <strong>{priceLabel}</strong>
        <span>{hours}</span>
        <strong>{estimatedTotal ? `Est. total ${estimatedTotal}` : "Est. total —"}</strong>
      </div>
    </section>
  );
}

function formatHours(hours: number) {
  return hours.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
