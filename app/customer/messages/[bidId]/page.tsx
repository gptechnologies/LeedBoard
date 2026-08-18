import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JobCoordinationSummary } from "@/components/marketplace/job-coordination-summary";
import { ActivityReadMarker } from "@/components/marketplace/activity-read-marker";
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
  const customerName = `${user.firstName} ${user.lastName}`;
  const isCompleted = bid.jobRequest.status === JobRequestStatus.COMPLETED;
  const statusTone = bid.status === BidStatus.ACCEPTED ? "success" : "default";
  const statusLabel = isCompleted ? "Completed" : getBidStatusLabel(bid.status);

  return (
    <div className="market-shell market-shell--detail">
      <ActivityReadMarker bidId={bid.id} role="customer" />
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
          <StatusPill label={statusLabel} tone={isCompleted ? "success" : statusTone} />
        </header>

        <div className="message-thread">
          <JobCoordinationSummary
            bid={bid}
            cleanerName={cleanerName}
            customerName={customerName}
            job={bid.jobRequest}
            role="customer"
          />

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
              <strong>{isCompleted ? "Cleaner marked this job complete." : "You accepted this bid."}</strong>
              <p>
                {isCompleted
                  ? "The job is complete. You can keep this summary for your records."
                  : "The cleaner can now review the confirmed address, timing, and access details."}
              </p>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
