import { BidPricingType, BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityReadMarker } from "@/components/marketplace/activity-read-marker";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { BidReceivedTime, BidSummary } from "@/components/marketplace/bid-summary";
import { CompletionFeedback } from "@/components/marketplace/completion-feedback";
import { ConversationThread } from "@/components/marketplace/conversation-thread";
import { initialBidMessage, toThreadMessage } from "@/lib/conversation";
import { expireJobIfDue } from "@/lib/job-lifecycle";
import { formatBidAmount, getBidEstimatedTotalCents } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { getJobReference } from "@/lib/providers";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = Promise<{ bidId: string }>;

export default async function CleanerMessageThreadPage({ params, searchParams }: {
  params: Params;
  searchParams: Promise<{ completed?: string; error?: string }>;
}) {
  const user = await requireUser(UserRole.CLEANER);
  const [{ bidId }, query] = await Promise.all([params, searchParams]);
  const ownedBid = await prisma.jobBid.findFirst({
    where: { id: bidId, OR: [{ cleanerId: user.id }, { cleanerLead: { linkedCleanerUserId: user.id } }] },
    select: { jobRequestId: true },
  });
  if (!ownedBid) notFound();
  await expireJobIfDue(ownedBid.jobRequestId);
  const bid = await prisma.jobBid.findUniqueOrThrow({
    where: { id: bidId },
    include: { jobRequest: true, messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
  const job = bid.jobRequest;
  const accepted = bid.status === BidStatus.ACCEPTED;
  const completed = job.status === JobRequestStatus.COMPLETED;
  const isHourly = bid.pricingType === BidPricingType.HOURLY && bid.hourlyRateCents && !bid.offerType;
  const totalCents = isHourly ? getBidEstimatedTotalCents(bid) : null;
  const closedReason = job.status === JobRequestStatus.EXPIRED
    ? "This job has ended"
    : job.status === JobRequestStatus.DELETED
      ? "This job was removed"
      : job.status === JobRequestStatus.CANCELLED
        ? "This job was cancelled"
        : bid.status === BidStatus.DECLINED || bid.status === BidStatus.WITHDRAWN
          ? "This conversation is closed"
          : null;

  return (
    <div className="wk-app-screen wk-message-detail-screen">
      <ActivityReadMarker bidId={bid.id} role="cleaner" />
      <AppScreenHeader brandHref="/cleaner" />
      <div className="wk-screen-content wk-message-detail-content">
        <h1 className="sr-only">Conversation for job {getJobReference(job)}</h1>
        <div className="wk-conversation-top">
          <Link className="wk-conversation-back" aria-label="Back to messages" href="/cleaner/messages"><ArrowLeft aria-hidden="true" /></Link>
          <div className="wk-conversation-bid">
            <BidReceivedTime createdAt={bid.createdAt} perspective="submitted" />
            <BidSummary
              address={[job.addressLine2, `${job.city}, ${job.state} ${job.postalCode}`].filter(Boolean).join(", ")}
              arrivalTime={bid.arrivalWindowStart}
              cleanerName={job.addressLine1}
              estimatedHours={bid.estimatedHours}
              estimatedTotal={totalCents ? formatCurrency(totalCents) : null}
              jobDate={bid.arrivalDate ?? job.requestedDate}
              jobId={getJobReference(job)}
              priceLabel={isHourly ? `${formatCurrency(bid.hourlyRateCents!)}/hr` : formatBidAmount(bid)}
            />
          </div>
        </div>
        {query.error ? <div className="notice error">{query.error}</div> : null}
        {query.completed ? <><CompletionFeedback /><div className="notice" role="status">Job marked complete.</div></> : null}
        <ConversationThread
          bidId={bid.id}
          chosenAt={accepted ? job.acceptedAt?.toISOString() : null}
          chosenDisplay="system"
          closedReason={closedReason}
          initialMessages={[...initialBidMessage(bid), ...bid.messages.map(toThreadMessage)]}
          role="cleaner"
        />
        <div className="wk-conversation-actions">
          {accepted && !completed ? (
            <form action={`/cleaner/jobs/${job.id}/complete`} method="post" className="wk-conversation-job-action">
              <span><Check aria-hidden="true" /> Your bid was accepted</span>
              <button type="submit">Mark complete</button>
            </form>
          ) : accepted ? <div className="wk-conversation-chosen"><Check aria-hidden="true" /> Job complete</div> : closedReason ? (
            <div className="wk-conversation-closed" role="status">
              <strong>{job.status === JobRequestStatus.DELETED ? "Job removed" : job.status === JobRequestStatus.EXPIRED || job.status === JobRequestStatus.CANCELLED ? "Job ended" : "Conversation closed"}</strong>
              <span>{job.status === JobRequestStatus.EXPIRED ? "The homeowner didn’t select a cleaner before the deadline." : job.status === JobRequestStatus.DELETED ? "The homeowner closed this job." : closedReason}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}
