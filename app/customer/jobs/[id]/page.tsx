import Link from "next/link";
import { BidStatus, UserRole } from "@prisma/client";
import { BidCard } from "@/components/marketplace/cards";
import { StatusPill } from "@/components/marketplace/status-pill";
import {
  formatPriorityTypes,
  formatRoomTypes,
  formatTimingSummary,
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

export default async function CustomerJobDetailPage({
  params,
}: {
  params: Params;
}) {
  const user = await requireUser(UserRole.CUSTOMER);
  const { id } = await params;
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

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Job detail</div>
            <h1>{job.title}</h1>
          </div>
          <StatusPill label={job.status === "AWARDED" ? "Bid accepted" : "Open for bids"} tone={job.status === "AWARDED" ? "success" : "default"} />
        </header>

        <article className="market-card">
          <div className="stack small">
            <strong>Rooms</strong>
            <span className="market-card__meta">{formatRoomTypes(job.roomTypes)}</span>
            {job.priorityTypes.length > 0 ? (
              <>
                <strong>Priorities</strong>
                <span className="market-card__meta">{formatPriorityTypes(job.priorityTypes)}</span>
              </>
            ) : null}
            <strong>Address</strong>
            <span className="market-card__meta">
              {job.addressLine1}, {job.city}, {job.state} {job.postalCode}
            </span>
            <strong>Access</strong>
            <span className="market-card__meta">
              {getEntryMethodLabel(job.entryMethod)} · {getSuppliesSourceLabel(job.suppliesSource)}
            </span>
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
