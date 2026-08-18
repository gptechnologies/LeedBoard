"use client";

import { CalendarDays, ChevronDown, MapPin, Undo2 } from "lucide-react";
import { useState } from "react";

import { RestorePassedJobButton } from "@/components/marketplace/restore-passed-job-button";
import { triggerHaptic } from "@/lib/haptics";

export type PassedJobSummary = {
  id: string;
  location: string;
  passedLabel: string;
  status: "OPEN" | "CLOSED";
  timing: string;
  title: string;
};

export function PassedJobsDisclosure({ jobs }: { jobs: PassedJobSummary[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`wk-account-disclosure${open ? " is-open" : ""}`}>
      <button
        aria-controls="cleaner-passed-jobs"
        aria-expanded={open}
        className="wk-profile-row wk-pressable"
        onClick={() => {
          setOpen((value) => !value);
          triggerHaptic("selection");
        }}
        type="button"
      >
        <Undo2 aria-hidden="true" />
        <span>Passed Jobs</span>
        <strong>{jobs.length}</strong>
        <ChevronDown aria-hidden="true" className="wk-account-disclosure__chevron" />
      </button>

      {open ? (
        <div className="wk-account-disclosure__content" id="cleaner-passed-jobs">
          {jobs.length ? jobs.map((job) => (
            <article className="wk-passed-job" key={job.id}>
              <div className="wk-passed-job__heading">
                <div><span>{job.passedLabel}</span><h3>{job.title}</h3></div>
                <span className={job.status === "OPEN" ? "is-open" : ""}>{job.status === "OPEN" ? "Open" : "Closed"}</span>
              </div>
              <div className="wk-passed-job__meta">
                <span><CalendarDays aria-hidden="true" />{job.timing}</span>
                <span><MapPin aria-hidden="true" />{job.location}</span>
              </div>
              {job.status === "OPEN" ? <RestorePassedJobButton jobId={job.id} /> : <p className="wk-passed-job__unavailable">This job is no longer accepting bids.</p>}
            </article>
          )) : (
            <p className="wk-account-disclosure__empty">Jobs you pass on will stay here in case you change your mind.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
