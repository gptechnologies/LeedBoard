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

        <article className="market-card cleaner-detail-summary">
          <dl className="cleaner-job-summary cleaner-job-summary--detail">
            <div>
              <dt>Requested time</dt>
              <dd>{formatTimingSummary(job)}</dd>
            </div>
            <div>
              <dt>Area</dt>
              <dd>{job.city}, {job.state}</dd>
            </div>
            <div>
              <dt>Request</dt>
              <dd>{job.title}</dd>
            </div>
            <div>
              <dt>Rooms</dt>
              <dd>{formatRoomTypes(job.roomTypes)}</dd>
            </div>
            <div>
              <dt>Clean level</dt>
              <dd>{getCleanLevelLabel(job.cleanLevel)}</dd>
            </div>
            <div>
              <dt>Entry</dt>
              <dd>{getEntryMethodLabel(job.entryMethod)}</dd>
            </div>
            <div>
              <dt>Customer history</dt>
              <dd>
                {getCustomerHistorySummary({
                  completedJobs: job.customerCompletedJobsSnapshot,
                  customerCreatedAt: job.customerMemberSinceSnapshot ?? job.customer.createdAt,
                })}
              </dd>
            </div>
          </dl>
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
