import { ProviderApprovalStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { CleanerJobsFeed } from "@/components/marketplace/cleaner-jobs-feed";
import {
  formatCleanerPriceLabel,
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
  if (cleaner?.cleanerProfile?.approvalStatus !== ProviderApprovalStatus.APPROVED) {
    return (
      <div className="market-shell market-shell--detail">
        <section className="market-surface market-empty">
          <strong>Your provider profile is under review.</strong>
          <p className="market-card__copy">Add your mobile number and service ZIPs, then we’ll review your account for nearby jobs.</p>
          <Link className="button-link" href="/cleaner/account#business-settings">Complete business settings</Link>
        </section>
      </div>
    );
  }
  const bidDefaults = {
    standardHourlyRateCents: cleaner?.cleanerProfile?.standardHourlyRateCents ?? null,
    standardFlatRateCents: cleaner?.cleanerProfile?.standardFlatRateCents ?? null,
    defaultEtaMinutes: cleaner?.cleanerProfile?.defaultEtaMinutes ?? null,
  };

  const toFeedJob = (job: (typeof openJobs)[number]) => ({
    areaLabel: `${job.city}, ${job.state}`,
    bathroomCount: job.snapshotBathroomCount ?? job.homeProfile?.bathroomCount ?? null,
    bedroomCount: job.snapshotBedroomCount ?? job.homeProfile?.bedroomCount ?? null,
    bidCount: job._count.bids,
    estimatedSquareFeet: job.snapshotEstimatedSquareFeet ?? job.homeProfile?.estimatedSquareFeet ?? null,
    id: job.id,
    job,
    priceLabel: formatCleanerPriceLabel({
      ...bidDefaults,
      hourlyRateFromCents: cleaner?.cleanerProfile?.hourlyRateFromCents ?? null,
    }),
    timingLabel: formatTimingSummary(job),
    title: job.title,
  });

  const feedJobs = openJobs.map(toFeedJob);
  return (
    <div className="wk-app-screen wk-jobs-screen">
      <CleanerJobsFeed
        bidDefaults={bidDefaults}
        error={params.error}
        jobs={feedJobs}
        passed={params.passed === "1"}
      />
    </div>
  );
}
