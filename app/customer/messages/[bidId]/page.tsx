import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JobCoordinationSummary } from "@/components/marketplace/job-coordination-summary";
import { StatusPill } from "@/components/marketplace/status-pill";
import { MessageComposer, ThreadMessages } from "@/components/marketplace/thread-messages";
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
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const user = await requireUser(UserRole.CUSTOMER);
  const [{ bidId }, query] = await Promise.all([params, searchParams]);
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
      messageThread: {
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
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

        {query.error ? <div className="notice error">{query.error}</div> : null}

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

          <ThreadMessages
            bid={bid}
            currentUserId={user.id}
            job={bid.jobRequest}
            messages={bid.messageThread?.messages ?? []}
          />

          {isCompleted ? (
            <article className="message-event message-event--system">
              <strong>Cleaner marked this job complete.</strong>
              <p>Payment is still ignored for testing, so this is the end state for now.</p>
            </article>
          ) : null}

          {bid.status === BidStatus.ACCEPTED ? (
            <MessageComposer action={`/customer/messages/${bid.id}/send`} />
          ) : null}
        </div>
      </section>
    </div>
  );
}
