import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { BidCard } from "@/components/marketplace/cards";
import {
  formatRoomTypes,
  formatTimingSummary,
  getCleanLevelLabel,
  rankVisibleBids,
} from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  error?: string;
}>;

export default async function CustomerJobBidsPage({
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
      bids: {
        include: {
          cleaner: {
            include: {
              cleanerProfile: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      acceptedBid: true,
    },
  });

  if (!job) {
    notFound();
  }

  if (job.status !== JobRequestStatus.OPEN) {
    redirect(`/customer/jobs/${job.id}`);
  }

  const activeBids = rankVisibleBids(
    job.bids.filter((bid) => bid.status === BidStatus.SUBMITTED),
  );
  const visibleBids = activeBids.slice(0, 3);

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Compare bids</div>
            <h1>{job.title}</h1>
          </div>
          <span className="market-count-pill">{visibleBids.length} of {activeBids.length} shown</span>
        </header>

        {query.error ? <div className="notice error">{query.error}</div> : null}

        <article className="market-card">
          <div className="stack small">
            <strong>{formatRoomTypes(job.roomTypes)}</strong>
            <span className="market-card__meta">{getCleanLevelLabel(job.cleanLevel)}</span>
            <span className="market-card__meta">
              {job.addressLine1}, {job.city}, {job.state} {job.postalCode}
            </span>
            <span className="market-card__meta">{formatTimingSummary(job)}</span>
          </div>
        </article>

        <form action={`/customer/jobs/${job.id}/delete`} method="post" className="market-card__actions">
          <button type="submit" className="secondary-submit">
            Delete Job
          </button>
        </form>

        {activeBids.length === 0 ? (
          <section className="market-empty">
            <strong>No bids yet.</strong>
            <p className="market-card__copy">
              Your job is live. Check back as cleaners submit quotes.
            </p>
          </section>
        ) : (
          <div className="stack">
            {visibleBids.map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                action={
                  <form action={`/customer/jobs/${job.id}/accept-bid`} method="post">
                    <input type="hidden" name="bidId" value={bid.id} />
                    <button type="submit">Accept Bid</button>
                  </form>
                }
              />
            ))}
            {activeBids.length > visibleBids.length ? (
              <div className="notice">
                Showing the top {visibleBids.length} bids ranked by reputation, timing fit, and price.
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
