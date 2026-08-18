import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FastBidDrawer } from "@/components/marketplace/fast-bid-drawer";
import { ProviderJobOverview, type NearbyJobSwipeItem } from "@/components/marketplace/nearby-job-swipe-carousel";
import { PassJobAction } from "@/components/marketplace/pass-job-action";
import { formatTimingSummary } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function CleanerJobDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser(UserRole.CLEANER);
  const { id } = await params;
  const query = await searchParams;
  const job = await prisma.jobRequest.findFirst({
    where: { id },
    select: {
      id: true,
      title: true,
      city: true,
      state: true,
      postalCode: true,
      serviceNeeds: true,
      roomTypes: true,
      cleanLevel: true,
      cleanType: true,
      currentCondition: true,
      suppliesSource: true,
      timingPreference: true,
      requestedDate: true,
      requestedWindowStart: true,
      requestedWindowEnd: true,
      notes: true,
      status: true,
      createdAt: true,
      homeProfile: {
        select: {
          bedroomCount: true,
          bathroomCount: true,
          estimatedSquareFeet: true,
          storyCount: true,
          hasPets: true,
          propertyType: true,
        },
      },
      bids: {
        where: { cleanerId: user.id },
        select: { id: true },
      },
      _count: {
        select: { bids: { where: { status: BidStatus.SUBMITTED } } },
      },
    },
  });

  if (!job || (job.status !== JobRequestStatus.OPEN && job.bids.length === 0)) notFound();
  const existingBid = job.bids[0] ?? null;
  if (existingBid) redirect(`/cleaner/messages/${existingBid.id}`);

  const timingLabel = formatTimingSummary(job);
  const item: NearbyJobSwipeItem = {
    areaLabel: `${job.city}, ${job.state}`,
    bathroomCount: job.homeProfile?.bathroomCount ?? null,
    bedroomCount: job.homeProfile?.bedroomCount ?? null,
    bidCount: job._count.bids,
    estimatedSquareFeet: job.homeProfile?.estimatedSquareFeet ?? null,
    id: job.id,
    job,
    timingLabel,
    title: job.title,
  };

  return (
    <div className="wk-app-screen wk-job-detail-screen">
      <main className="wk-screen-content">
        <header className="wk-detail-page-heading">
          <Link href="/cleaner"><ChevronLeft aria-hidden="true" />Back to Open Jobs</Link>
          <h1>Job Details</h1>
        </header>

        {query.error ? <div className="notice error">{query.error}</div> : null}

        <article className="wk-provider-job-card wk-provider-job-card--detail">
          <ProviderJobOverview detail item={item} />
        </article>

        <div className="wk-detail-job-actions">
          <FastBidDrawer
            defaults={{
              standardHourlyRateCents: user.cleanerProfile?.standardHourlyRateCents ?? null,
              standardFlatRateCents: user.cleanerProfile?.standardFlatRateCents ?? null,
              defaultEtaMinutes: user.cleanerProfile?.defaultEtaMinutes ?? null,
            }}
            job={job}
            timingLabel={timingLabel}
            trigger={<button className="wk-detail-bid" type="button">Bid on Job</button>}
          />
          <PassJobAction jobId={job.id} />
        </div>
      </main>
    </div>
  );
}
