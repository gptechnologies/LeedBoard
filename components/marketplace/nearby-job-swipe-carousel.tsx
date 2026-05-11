"use client";

import Link from "next/link";

import {
  CleanerUpNextJobCardBody,
  type CleanerUpNextJob,
} from "@/components/marketplace/cleaner-up-next-job-card";
import { EmptyState } from "@/components/marketplace/empty-state";
import { FastBidDrawer } from "@/components/marketplace/fast-bid-drawer";
import { JobStackScroll } from "@/components/marketplace/job-stack-scroll";

export type NearbyJobSwipeItem = {
  areaLabel: string;
  bathroomCount: number | null;
  bedroomCount: number | null;
  bidCount: number;
  estimatedSquareFeet: number | null;
  id: string;
  job: CleanerUpNextJob;
  postedLabel: string;
  timingLabel: string;
  title: string;
};

export function NearbyJobSwipeCarousel({
  defaults,
  jobs,
}: {
  defaults: {
    standardHourlyRateCents: number | null;
    standardFlatRateCents: number | null;
    defaultEtaMinutes: number | null;
  };
  jobs: NearbyJobSwipeItem[];
}) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        body="Jobs accepting bids near your service area will show here."
        title="No nearby jobs"
      />
    );
  }

  return (
    <JobStackScroll className="cleaner-nearby-stack">
      {jobs.map(({ job, timingLabel }) => (
        <div key={job.id} className="cleaner-upnext-card cleaner-upnext-card--nearby">
          <Link href={`/cleaner/jobs/${job.id}`} className="cleaner-upnext-card__body cleaner-upnext-card__body-link">
            <CleanerUpNextJobCardBody job={job} timingLabel={timingLabel} />
          </Link>
          <FastBidDrawer
            defaults={defaults}
            job={job}
            timingLabel={timingLabel}
            trigger={
              <button type="button" className="cleaner-upnext-card__bid-cta cleaner-upnext-card__bid-button">
                Bid
              </button>
            }
          />
        </div>
      ))}
    </JobStackScroll>
  );
}
