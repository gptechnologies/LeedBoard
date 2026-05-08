"use client";

import Link from "next/link";
import { useState } from "react";

export type CleanerFeedJob = {
  id: string;
  title: string;
  timeLabel: string;
  areaLabel: string;
  roomsLabel: string;
  cleanLevelLabel: string;
  entryLabel: string;
  historyLabel: string;
  iconKind: "home" | "kitchen" | "apartment" | "box";
};

export type CleanerFeedBid = {
  id: string;
  jobId: string;
  title: string;
  timeLabel: string;
  areaLabel: string;
  priceLabel: string;
};

export function CleanerJobsFeed({
  jobs,
  bids,
}: {
  jobs: CleanerFeedJob[];
  bids: CleanerFeedBid[];
}) {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(jobs[0]?.id ?? null);
  const [showBids, setShowBids] = useState(bids.length > 0);

  return (
    <>
      <section className="cleaner-jobs-section">
        <h2>Jobs near you</h2>
        {jobs.length === 0 ? (
          <section className="market-empty">
            <strong>No open jobs right now.</strong>
            <p className="market-card__copy">
              New requests that match your service area and specialties will show here.
            </p>
          </section>
        ) : (
          <div className="cleaner-job-list">
            {jobs.map((job) => {
              const isExpanded = expandedJobId === job.id;

              return (
                <article
                  key={job.id}
                  className={
                    isExpanded
                      ? "cleaner-job-card cleaner-job-card--interactive expanded"
                      : "cleaner-job-card cleaner-job-card--interactive"
                  }
                >
                  <button
                    type="button"
                    className="cleaner-job-card__toggle"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  >
                    <ServiceSymbol kind={job.iconKind} />
                    <span className="cleaner-job-card__content">
                      <strong>{job.timeLabel}</strong>
                      <span className="cleaner-job-card__meta">
                        <MetaIcon name="pin" />
                        {job.areaLabel}
                      </span>
                      <span className="cleaner-job-card__meta cleaner-job-card__service">
                        {job.title}
                      </span>
                    </span>
                    <span className="cleaner-expand-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>

                  {isExpanded ? <JobSummary job={job} /> : null}

                  <Link href={`/cleaner/jobs/${job.id}`} className="cleaner-action-button">
                    Bid
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="cleaner-jobs-section">
        <button
          type="button"
          className="cleaner-section-toggle"
          aria-expanded={showBids}
          onClick={() => setShowBids((current) => !current)}
        >
          <span>Open bids</span>
          <span>{bids.length}</span>
        </button>

        {showBids ? (
          bids.length === 0 ? (
            <section className="market-empty cleaner-empty-compact">
              <strong>No open bids yet.</strong>
              <p className="market-card__copy">Submitted bids will appear here.</p>
            </section>
          ) : (
            <div className="cleaner-open-bids">
              {bids.map((bid) => (
                <Link
                  key={bid.id}
                  href={`/cleaner/jobs/${bid.jobId}`}
                  className="cleaner-open-bid-card"
                >
                  <span>
                    <strong>{bid.timeLabel}</strong>
                    <small>{bid.areaLabel}</small>
                  </span>
                  <span>
                    <strong>{bid.priceLabel}</strong>
                    <small>{bid.title}</small>
                  </span>
                </Link>
              ))}
            </div>
          )
        ) : null}
      </section>
    </>
  );
}

function JobSummary({ job }: { job: CleanerFeedJob }) {
  const rows = [
    ["Requested time", job.timeLabel],
    ["Area", job.areaLabel],
    ["Request", job.title],
    ["Rooms", job.roomsLabel],
    ["Clean level", job.cleanLevelLabel],
    ["Entry", job.entryLabel],
    ["Customer history", job.historyLabel],
  ];

  return (
    <dl className="cleaner-job-summary">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ServiceSymbol({
  kind,
}: {
  kind: "home" | "kitchen" | "apartment" | "box";
}) {
  return (
    <span className="cleaner-service-symbol" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        {kind === "kitchen" ? (
          <>
            <path d="M7 4h10v16H7z" />
            <path d="M9 4v4h6V4" />
            <path d="M10 12h4v4h-4z" />
            <path d="M9.5 7h.01" />
            <path d="M12 7h.01" />
            <path d="M14.5 7h.01" />
          </>
        ) : null}
        {kind === "box" ? (
          <>
            <path d="m4 8 8-4 8 4-8 4z" />
            <path d="M4 8v8l8 4 8-4V8" />
            <path d="M12 12v8" />
            <path d="m16 6-8 4" />
          </>
        ) : null}
        {kind === "apartment" ? (
          <>
            <path d="M5 21V5h10v16" />
            <path d="M15 10h4v11" />
            <path d="M9 9h2" />
            <path d="M9 13h2" />
            <path d="M9 21v-4h2v4" />
          </>
        ) : null}
        {kind === "home" ? (
          <>
            <path d="m4 11 8-7 8 7" />
            <path d="M6.5 10.5V20h11v-9.5" />
            <path d="M10 20v-5h4v5" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function MetaIcon({ name }: { name: "pin" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {name === "pin" ? (
        <>
          <path d="M12 21s6-5.3 6-11a6 6 0 0 0-12 0c0 5.7 6 11 6 11z" />
          <path d="M12 10.5h.01" />
        </>
      ) : null}
    </svg>
  );
}
