import { JobRequestStatus, UserRole } from "@prisma/client";
import { BidForm } from "@/components/marketplace/bid-form";
import {
  formatRoomTypes,
  formatTimingSummary,
  getCleanLevelLabel,
  getCustomerHistorySummary,
  getEntryMethodLabel,
} from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  error?: string;
}>;

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
    where: {
      id,
      status: JobRequestStatus.OPEN,
    },
    include: {
      customer: {
        include: {
          customerJobRequests: {
            where: {
              status: JobRequestStatus.AWARDED,
            },
            select: { id: true },
          },
        },
      },
      homeProfile: true,
      bids: {
        where: {
          cleanerId: user.id,
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const bedroomCount = job.homeProfile?.bedroomCount;
  const bathroomCount = job.homeProfile?.bathroomCount;
  const bathroomLabel = bathroomCount
    ? `${Number.isInteger(bathroomCount) ? bathroomCount.toFixed(0) : bathroomCount} bath`
    : null;
  const homeDetails = [
    bedroomCount ? `${bedroomCount} bed` : null,
    bathroomLabel,
  ].filter(Boolean);
  const hasExistingBid = job.bids.length > 0;

  return (
    <div className="market-shell market-shell--detail bid-screen">
      <section className="market-surface">
        <header className="bid-screen__header">
          <Link href="/cleaner" className="bid-screen__back" aria-label="Back to cleaner jobs">
            <span aria-hidden="true">&larr;</span>
          </Link>
          <h1>{hasExistingBid ? "Update Your Bid" : "Place Your Bid"}</h1>
          <span className="bid-screen__header-spacer" aria-hidden="true" />
        </header>

        {query.error ? <div className="notice error">{query.error}</div> : null}

        <article className="market-card bid-job-card">
          <div className="bid-job-card__media" aria-hidden="true">
            <span>Wk</span>
          </div>
          <div className="bid-job-card__body">
            <div className="bid-job-card__title-row">
              <div>
                <h2>{job.title}</h2>
                <p>{homeDetails.length > 0 ? homeDetails.join(" · ") : formatRoomTypes(job.roomTypes)}</p>
              </div>
              <span className="bid-job-card__badge">{getCleanLevelLabel(job.cleanLevel)}</span>
            </div>
            <div className="bid-job-card__meta">
              <span>{formatTimingSummary(job)}</span>
              <span>{job.city}, {job.state}</span>
              <span>{getEntryMethodLabel(job.entryMethod)}</span>
            </div>
            <div className="bid-job-card__chips">
              <span>{formatRoomTypes(job.roomTypes)}</span>
              <span>
                {getCustomerHistorySummary({
                  completedJobs: job.customerCompletedJobsSnapshot,
                  customerCreatedAt: job.customerMemberSinceSnapshot ?? job.customer.createdAt,
                })}
              </span>
            </div>
          </div>
          {job.notes ? (
            <div className="cleaner-detail-note">
              <strong>Job notes</strong>
              <p>{job.notes}</p>
            </div>
          ) : null}
        </article>

        <BidForm
          jobId={job.id}
          timingPreference={job.timingPreference}
          requestedDate={job.requestedDate}
          requestedWindowStart={job.requestedWindowStart}
          requestedWindowEnd={job.requestedWindowEnd}
          serviceNeeds={job.serviceNeeds}
          hasExistingBid={hasExistingBid}
          defaults={{
            standardHourlyRateCents: user.cleanerProfile?.standardHourlyRateCents ?? null,
            standardFlatRateCents: user.cleanerProfile?.standardFlatRateCents ?? null,
            standardDeepCleanFlatRateCents:
              user.cleanerProfile?.standardDeepCleanFlatRateCents ?? null,
            defaultEtaMinutes: user.cleanerProfile?.defaultEtaMinutes ?? null,
          }}
        />
      </section>
    </div>
  );
}
