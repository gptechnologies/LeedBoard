import { UserRole } from "@prisma/client";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
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
      <AppScreenHeader accountMenu initials={initials} />
      <div className="wk-screen-content">
        <header className="wk-provider-jobs-heading">
          <h1>Open Jobs</h1>
          <p>Browse nearby cleaning jobs</p>
        </header>
        {params.error ? <div className="notice error">{params.error}</div> : null}
        {params.passed === "1" ? <div className="wk-provider-toast" role="status">Job moved to Passed.</div> : null}
        <CleanerJobsFeed
          bidDefaults={bidDefaults}
          jobs={feedJobs}
        />
      </div>
    </div>
  );
}
