import { JobRequestStatus, UserRole } from "@prisma/client";
import { BidForm } from "@/components/marketplace/bid-form";
import {
  formatPriorityTypes,
  formatRoomTypes,
  formatTimingSummary,
  getCustomerHistorySummary,
  getEntryMethodLabel,
  getSuppliesSourceLabel,
} from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
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

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Submit a bid</div>
            <h1>{job.title}</h1>
          </div>
        </header>

        {query.error ? <div className="notice error">{query.error}</div> : null}

        <article className="market-card">
          <div className="stack small">
            <strong>{job.customer.firstName} {job.customer.lastName}</strong>
            <span className="market-card__meta">
              {job.city}, {job.state} {job.postalCode}
            </span>
            <span className="market-card__meta">{formatRoomTypes(job.roomTypes)}</span>
            {job.priorityTypes.length > 0 ? (
              <span className="market-card__meta">{formatPriorityTypes(job.priorityTypes)}</span>
            ) : null}
            <span className="market-card__meta">
              {getEntryMethodLabel(job.entryMethod)} · {getSuppliesSourceLabel(job.suppliesSource)}
            </span>
            <span className="market-card__meta">
              {getCustomerHistorySummary({
                completedJobs: job.customerCompletedJobsSnapshot,
                customerCreatedAt: job.customerMemberSinceSnapshot ?? job.customer.createdAt,
              })}
            </span>
            <span className="market-card__meta">{formatTimingSummary(job)}</span>
            {job.notes ? <p className="market-card__copy">{job.notes}</p> : null}
          </div>
        </article>

        <BidForm
          jobId={job.id}
          timingPreference={job.timingPreference}
          requestedDate={job.requestedDate}
          requestedWindowStart={job.requestedWindowStart}
          requestedWindowEnd={job.requestedWindowEnd}
          serviceNeeds={job.serviceNeeds}
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
