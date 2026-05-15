import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JobCoordinationSummary } from "@/components/marketplace/job-coordination-summary";
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
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{
    completed?: string;
    error?: string;
  }>;
}) {
  const user = await requireUser(UserRole.CLEANER);
  const [{ bidId }, query] = await Promise.all([params, searchParams]);
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
  const cleanerName = `${user.firstName} ${user.lastName}`;
  const isCompleted = bid.jobRequest.status === JobRequestStatus.COMPLETED;
  const statusTone = bid.status === BidStatus.ACCEPTED ? "success" : "default";
  const statusLabel = isCompleted ? "Completed" : getBidStatusLabel(bid.status);

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
          <StatusPill label={statusLabel} tone={isCompleted ? "success" : statusTone} />
        </header>

        {query.error ? <div className="notice error">{query.error}</div> : null}
        {query.completed ? <div className="notice">Job marked complete.</div> : null}

        <div className="message-thread">
          <JobCoordinationSummary
            bid={bid}
            cleanerName={cleanerName}
            customerName={homeownerName}
            job={bid.jobRequest}
            role="cleaner"
          />

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
              <strong>
                {isCompleted ? "You marked this job complete." : "Homeowner accepted your bid."}
              </strong>
              <p>
                {isCompleted
                  ? "The homeowner can now see the completed job state in this thread."
                  : "This job is confirmed. Keep details and next steps in this thread."}
              </p>
            </article>
          ) : null}

          {bid.status === BidStatus.ACCEPTED && !isCompleted ? (
            <form action={`/cleaner/jobs/${bid.jobRequestId}/complete`} method="post" className="market-bottom-action">
              <div>
                <strong>Finish the job</strong>
                <span>Mark complete after the cleaning is done.</span>
              </div>
              <button type="submit">Mark Complete</button>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  );
}
