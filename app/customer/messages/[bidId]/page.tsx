import { BidStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPill } from "@/components/marketplace/status-pill";
import { getCleaningJobTitle } from "@/lib/job-title";
import {
  formatBidAmount,
  formatBidTiming,
  getBidStatusLabel,
} from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = Promise<{
  bidId: string;
}>;

export default async function CustomerMessageThreadPage({
  params,
}: {
  params: Params;
}) {
  const user = await requireUser(UserRole.CUSTOMER);
  const { bidId } = await params;
  const bid = await prisma.jobBid.findFirst({
    where: {
      id: bidId,
      jobRequest: {
        customerId: user.id,
      },
    },
    include: {
      cleaner: {
        include: {
          cleanerProfile: true,
        },
      },
      jobRequest: {
        include: {
          homeProfile: {
            select: {
              propertyType: true,
            },
          },
        },
      },
    },
  });

  if (!bid) {
    notFound();
  }

  const cleanerName = `${bid.cleaner.firstName} ${bid.cleaner.lastName}`;
  const statusTone = bid.status === BidStatus.ACCEPTED ? "success" : "default";

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <Link
            href={`/customer/jobs/${bid.jobRequestId}/bids`}
            className="bid-screen__back"
            aria-label="Back to bids"
          >
            <span aria-hidden="true">&larr;</span>
          </Link>
          <div>
            <h1>{cleanerName}</h1>
            <p>{getCleaningJobTitle(bid.jobRequest)}</p>
          </div>
          <StatusPill label={getBidStatusLabel(bid.status)} tone={statusTone} />
        </header>

        <div className="message-thread">
          <article className="message-event message-event--bid">
            <div className="message-event__meta">
              <strong>{cleanerName}'s bid</strong>
              <span>{bid.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}</span>
            </div>
            <div className="message-event__quote">
              <strong>{formatBidAmount(bid)}</strong>
              <span>{formatBidTiming(bid)}</span>
            </div>
            {bid.message ? <p>{bid.message}</p> : null}
          </article>

          {bid.status === BidStatus.ACCEPTED ? (
            <article className="message-event message-event--system">
              <strong>You accepted this bid.</strong>
              <p>The cleaner will see this confirmation in the same thread.</p>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
