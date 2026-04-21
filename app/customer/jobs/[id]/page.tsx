import Link from "next/link";
import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { BidCard } from "@/components/marketplace/cards";
import { StatusPill } from "@/components/marketplace/status-pill";
import {
  formatRoomTypes,
  formatTimingSummary,
  getCleanLevelLabel,
  getEntryMethodLabel,
  getJobRequestStatusLabel,
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

export default async function CustomerJobDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser(UserRole.CUSTOMER);
  const { id } = await params;
  const query = await searchParams;
  const job = await prisma.jobRequest.findFirst({
    where: {
      id,
      customerId: user.id,
    },
    include: {
      acceptedBid: {
        include: {
          cleaner: {
            include: {
              cleanerProfile: true,
            },
          },
        },
      },
      bids: {
        where: {
          status: BidStatus.SUBMITTED,
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const statusTone =
    job.status === JobRequestStatus.OPEN
      ? "active"
      : job.status === JobRequestStatus.AWARDED
        ? "success"
        : job.status === JobRequestStatus.CANCELLED
          ? "danger"
          : "warning";

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Job detail</div>
            <h1>{job.title}</h1>
          </div>
          <StatusPill
            label={getJobRequestStatusLabel(job.status)}
            tone={statusTone}
          />
        </header>

        {query.error ? <div className="notice error">{query.error}</div> : null}

        <article className="market-card">
          <div className="stack small">
            <strong>Rooms</strong>
            <span className="market-card__meta">{formatRoomTypes(job.roomTypes)}</span>
            <strong>Level of clean</strong>
            <span className="market-card__meta">{getCleanLevelLabel(job.cleanLevel)}</span>
            <strong>Address</strong>
            <span className="market-card__meta">
              {job.addressLine1}, {job.city}, {job.state} {job.postalCode}
            </span>
            <strong>Access</strong>
            <span className="market-card__meta">{getEntryMethodLabel(job.entryMethod)}</span>
            {job.entryNotes ? <p className="market-card__copy">{job.entryNotes}</p> : null}
            <strong>Timing</strong>
            <span className="market-card__meta">{formatTimingSummary(job)}</span>
            {job.notes ? (
              <>
                <strong>Notes</strong>
                <p className="market-card__copy">{job.notes}</p>
              </>
            ) : null}
          </div>
        </article>

        {job.status === JobRequestStatus.OPEN ? (
          <form action={`/customer/jobs/${job.id}/delete`} method="post" className="market-card__actions">
            <button type="submit" className="button secondary">
              Delete Job
            </button>
          </form>
        ) : null}

        {job.acceptedBid ? (
          <section className="stack">
            <div className="market-section-heading">
              <h2>Accepted bid</h2>
            </div>
            <BidCard bid={job.acceptedBid} />
          </section>
        ) : (
          <section className="market-empty">
            <strong>{job.bids.length} active bids</strong>
            <p className="market-card__copy">
              Review the submitted quotes and accept the one that fits best.
            </p>
            <Link href={`/customer/jobs/${job.id}/bids`} className="button-link">
              Review Bids
            </Link>
          </section>
        )}
      </section>
    </div>
  );
}
