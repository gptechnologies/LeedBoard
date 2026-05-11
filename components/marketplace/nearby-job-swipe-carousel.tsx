"use client";

import {
  CleanerUpNextJobCard,
  type CleanerUpNextJob,
} from "@/components/marketplace/cleaner-up-next-job-card";
import { EmptyState } from "@/components/marketplace/empty-state";
import { JobStackScroll } from "@/components/marketplace/job-stack-scroll";

export type NearbyJobSwipeItem = {
  areaLabel: string;
  bathroomCount: number | null;
  bedroomCount: number | null;
  bidCount: number;
  estimatedSquareFeet: number | null;
  hasPets: boolean;
  id: string;
  job: CleanerUpNextJob;
  postedLabel: string;
  timingLabel: string;
  title: string;
};

export function NearbyJobSwipeCarousel({
  jobs,
}: {
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
        <CleanerUpNextJobCard
          className="cleaner-upnext-card--nearby"
          job={job}
          key={job.id}
          timingLabel={timingLabel}
          statusLabel="Accepting bids"
        />
      ))}
    </JobStackScroll>
  );
}
