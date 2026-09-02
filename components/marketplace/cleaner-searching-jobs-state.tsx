"use client";

import { memo } from "react";
import { MapPin, RefreshCw, Search } from "lucide-react";

export const CleanerSearchingJobsState = memo(function CleanerSearchingJobsState({
  isRefreshing,
  onRefresh,
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="wk-cleaner-searching" aria-labelledby="cleaner-searching-title">
      <div className="wk-cleaner-searching__radar" aria-hidden="true">
        <span className="wk-cleaner-searching__ring wk-cleaner-searching__ring--one" />
        <span className="wk-cleaner-searching__ring wk-cleaner-searching__ring--two" />
        <span className="wk-cleaner-searching__ring wk-cleaner-searching__ring--three" />
        <span className="wk-cleaner-searching__sweep"><i /></span>
        <span className="wk-cleaner-searching__pin wk-cleaner-searching__pin--one"><MapPin /></span>
        <span className="wk-cleaner-searching__pin wk-cleaner-searching__pin--two"><MapPin /></span>
        <span className="wk-cleaner-searching__center"><Search /></span>
      </div>

      <div className="wk-cleaner-searching__copy">
        <span className="wk-cleaner-searching__status" role="status">
          <i aria-hidden="true" />
          {isRefreshing ? "Checking now" : "Searching for jobs"}
        </span>
        <h1 id="cleaner-searching-title">Looking for your next job</h1>
        <p>
          We’re checking new homeowner requests in your service area. Matching jobs will appear here without leaving this tab.
        </p>
      </div>

      <div className="wk-cleaner-searching__activity" aria-label="Job search status">
        <span><i aria-hidden="true" /> Service area active</span>
        <span>Updates every 30 seconds</span>
      </div>

      <button
        className="wk-cleaner-searching__refresh wk-pressable"
        disabled={isRefreshing}
        onClick={onRefresh}
        type="button"
      >
        <RefreshCw className={isRefreshing ? "is-spinning" : ""} aria-hidden="true" />
        {isRefreshing ? "Checking for jobs" : "Check now"}
      </button>
    </section>
  );
});
