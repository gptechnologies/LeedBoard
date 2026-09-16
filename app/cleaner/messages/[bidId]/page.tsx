import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JobCoordinationSummary } from "@/components/marketplace/job-coordination-summary";
import { CompletionFeedback } from "@/components/marketplace/completion-feedback";
import { ActivityReadMarker } from "@/components/marketplace/activity-read-marker";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { ConversationThread } from "@/components/marketplace/conversation-thread";
import { ConnectionHandoff } from "@/components/marketplace/connection-handoff";
import { StatusPill } from "@/components/marketplace/status-pill";
import { getCleaningJobTitle } from "@/lib/job-title";
import { initialBidMessage, toThreadMessage } from "@/lib/conversation";
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
      OR: [{ cleanerId: user.id }, { cleanerLead: { linkedCleanerUserId: user.id } }],
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
      messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
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
    <div className="wk-app-screen wk-message-detail-screen">
      <ActivityReadMarker bidId={bid.id} role="cleaner" />
      <AppScreenHeader brandHref="/cleaner" />
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <Link href="/cleaner/messages" className="bid-screen__back" aria-label="Back to activity">
            <span aria-hidden="true">&larr;</span>
          </Link>
          <div>
            <h1>{homeownerName}</h1>
            <p>{getCleaningJobTitle(bid.jobRequest)}</p>
          </div>
          <StatusPill label={statusLabel} tone={isCompleted ? "success" : statusTone} />
        </header>

        {query.error ? <div className="notice error">{query.error}</div> : null}
        {query.completed ? <><CompletionFeedback /><div className="notice" role="status">Job marked complete.</div></> : null}

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
          </article>

          <ConversationThread
            bidId={bid.id}
            chosenAt={bid.status === BidStatus.ACCEPTED ? bid.jobRequest.acceptedAt?.toISOString() : null}
            otherInitials={`${bid.jobRequest.customer.firstName.charAt(0)}${bid.jobRequest.customer.lastName.charAt(0)}`.toUpperCase()}
            disabled={Boolean(bid.conversationClosedAt) || bid.status === BidStatus.ACCEPTED || bid.status === BidStatus.DECLINED || bid.status === BidStatus.WITHDRAWN || bid.jobRequest.status === JobRequestStatus.CANCELLED || bid.jobRequest.status === JobRequestStatus.EXPIRED}
            initialMessages={[...initialBidMessage(bid), ...bid.messages.map(toThreadMessage)]}
            role="cleaner"
          />

          {bid.status === BidStatus.ACCEPTED ? (
            <ConnectionHandoff
              address={[bid.jobRequest.addressLine1, bid.jobRequest.addressLine2, `${bid.jobRequest.city}, ${bid.jobRequest.state} ${bid.jobRequest.postalCode}`].filter(Boolean).join(", ")}
              homeownerName={homeownerName}
              homeownerPhone={bid.jobRequest.customer.phone}
              providerName={cleanerName}
              providerPhone={user.phone}
            />
          ) : null}

          {isCompleted ? (
            <article className="message-event message-event--system">
              <strong>You marked this job complete.</strong>
              <p>The homeowner can now see the completed job state in their activity.</p>
            </article>
          ) : null}

        </div>
      </section>
    </div>
  );
}
