import { UserRole } from "@prisma/client";
import { CleanerJobsFeed } from "@/components/marketplace/cleaner-jobs-feed";
import {
  formatTimingSummary,
  getCleanerHomeData,
} from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CleanerDashboardProps = {
  searchParams: Promise<{
    error?: string;
    passed?: string;
  }>;
};

export default async function CleanerDashboard({ searchParams }: CleanerDashboardProps) {
  const user = await requireUser(UserRole.CLEANER);
  const params = await searchParams;
  const { cleaner, openJobs } = await getCleanerHomeData(user.id);
  const bidDefaults = {
    standardHourlyRateCents: cleaner?.cleanerProfile?.standardHourlyRateCents ?? null,
    standardFlatRateCents: cleaner?.cleanerProfile?.standardFlatRateCents ?? null,
    defaultEtaMinutes: cleaner?.cleanerProfile?.defaultEtaMinutes ?? null,
  };

  const toFeedJob = (job: (typeof openJobs)[number]) => ({
    areaLabel: `${job.city}, ${job.state}`,
    bathroomCount: job.homeProfile?.bathroomCount ?? null,
    bedroomCount: job.homeProfile?.bedroomCount ?? null,
    bidCount: job._count.bids,
    estimatedSquareFeet: job.homeProfile?.estimatedSquareFeet ?? null,
    id: job.id,
    job,
    timingLabel: formatTimingSummary(job),
    title: job.title,
  });

  const feedJobs = openJobs.map(toFeedJob);
  const businessName = cleaner?.cleanerProfile?.businessName || `${user.firstName} ${user.lastName}`;
  const initials = businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="wk-app-screen wk-jobs-screen">
      <CleanerJobsFeed
        bidDefaults={bidDefaults}
        error={params.error}
        initials={initials}
        jobs={feedJobs}
        passed={params.passed === "1"}
      />
    </div>
  );
}
