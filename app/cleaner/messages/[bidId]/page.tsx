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

export default async function CleanerMessageThreadPage({
  params,
}: {
  params: Params;
}) {
  const user = await requireUser(UserRole.CLEANER);
  const { bidId } = await params;
  const bid = await prisma.jobBid.findFirst({
    where: {
      id: bidId,
      cleanerId: user.id,
    },
    include: {
      jobRequest: {
        include: {
          customer: true,
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

  const homeownerName = `${bid.jobRequest.customer.firstName} ${bid.jobRequest.customer.lastName}`;
  const statusTone = bid.status === BidStatus.ACCEPTED ? "success" : "default";

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <Link href="/cleaner/messages" className="bid-screen__back" aria-label="Back to messages">
            <span aria-hidden="true">&larr;</span>
          </Link>
          <div>
            <h1>{homeownerName}</h1>
            <p>{getCleaningJobTitle(bid.jobRequest)}</p>
          </div>
          <StatusPill label={getBidStatusLabel(bid.status)} tone={statusTone} />
        </header>

        <div className="message-thread">
          <article className="message-event message-event--bid">
            <div className="message-event__meta">
              <strong>Your bid</strong>
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
              <strong>Homeowner accepted your bid.</strong>
              <p>This job is confirmed. Keep details and next steps in this thread.</p>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
