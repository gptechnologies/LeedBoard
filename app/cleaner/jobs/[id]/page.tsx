import { JobRequestStatus, UserRole } from "@prisma/client";
import { FastBidDrawer } from "@/components/marketplace/fast-bid-drawer";
import {
  formatRoomTypes,
  formatTimingSummary,
  getCleanLevelLabel,
  getCustomerHistorySummary,
  getEntryMethodLabel,
  getHomeConditionLabel,
  getJobCleanTypeLabel,
  getJobPriorityAreaLabel,
  getBidSelectionPriorityLabel,
} from "@/lib/marketplace";
import { getCleaningJobTitle } from "@/lib/job-title";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
    },
    include: {
      customer: {
        include: {
          customerJobRequests: {
            where: {
              status: JobRequestStatus.COMPLETED,
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

  if (!job || (job.status !== JobRequestStatus.OPEN && job.bids.length === 0)) {
    notFound();
  }

  const existingBid = job.bids[0] ?? null;
  if (existingBid) {
    redirect(`/cleaner/messages/${existingBid.id}`);
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
  const petsChip =
    job.homeProfile == null
      ? null
      : job.homeProfile.hasPets
        ? "Pets"
        : "No pets";
  const matchingDetails = [
    job.cleanType ? { label: "Clean type", value: getJobCleanTypeLabel(job.cleanType) } : null,
    job.currentCondition
      ? { label: "Condition", value: getHomeConditionLabel(job.currentCondition) }
      : null,
    job.matchingPriorityAreas.length > 0
      ? {
          label: "Priority areas",
          value: job.matchingPriorityAreas.map(getJobPriorityAreaLabel).join(", "),
        }
      : null,
    job.selectionPriority
      ? { label: "Most important", value: getBidSelectionPriorityLabel(job.selectionPriority) }
      : null,
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail));

  return (
    <div className="market-shell market-shell--detail bid-screen">
      <section className="market-surface">
        <header className="bid-screen__header">
          <Link href="/cleaner" className="bid-screen__back" aria-label="Back to cleaner jobs">
            <span aria-hidden="true">&larr;</span>
          </Link>
          <h1>Job Details</h1>
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
                <h2>{getCleaningJobTitle(job)}</h2>
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
              {petsChip ? <span>{petsChip}</span> : null}
            </div>
          </div>
          {job.notes ? (
            <div className="cleaner-detail-note">
              <strong>Job notes</strong>
              <p>{job.notes}</p>
            </div>
          ) : null}
          {matchingDetails.length > 0 ? (
            <div className="cleaner-detail-note cleaner-detail-matching">
              <strong>Matching details</strong>
              <dl>
                {matchingDetails.map((detail) => (
                  <div key={detail.label}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </article>

        <div className="cleaner-detail-bid-action">
          <FastBidDrawer
            defaults={{
              standardHourlyRateCents: user.cleanerProfile?.standardHourlyRateCents ?? null,
              standardFlatRateCents: user.cleanerProfile?.standardFlatRateCents ?? null,
              defaultEtaMinutes: user.cleanerProfile?.defaultEtaMinutes ?? null,
            }}
            job={job}
            timingLabel={formatTimingSummary(job)}
            triggerMode="button"
          />
        </div>
      </section>
    </div>
  );
}
