import { BidPricingType, BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityReadMarker } from "@/components/marketplace/activity-read-marker";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { BidReceivedTime, BidSummary } from "@/components/marketplace/bid-summary";
import { ConversationThread } from "@/components/marketplace/conversation-thread";
import { ProviderSelectionDrawer } from "@/components/marketplace/provider-selection-drawer";
import { initialBidMessage, toThreadMessage } from "@/lib/conversation";
import { formatBidAmount, formatBidTiming, getBidEstimatedTotalCents } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { getConversationReference, getJobReference, getProviderName } from "@/lib/providers";
import { isConversationSmsReady } from "@/lib/sms";
import { requireUser } from "@/lib/session";
import { expireJobIfDue } from "@/lib/job-lifecycle";

export const dynamic = "force-dynamic";

type Params = Promise<{ bidId: string }>;

export default async function CustomerMessageThreadPage({ params }: { params: Params }) {
  const user = await requireUser(UserRole.CUSTOMER);
  const { bidId } = await params;
  const owned = await prisma.jobBid.findFirst({ where: { id: bidId, jobRequest: { customerId: user.id } }, select: { jobRequestId: true } });
  if (!owned) notFound();
  await expireJobIfDue(owned.jobRequestId);
  const bid = await prisma.jobBid.findFirst({
    where: { id: bidId, jobRequest: { customerId: user.id } },
    include: {
      cleanerLead: true,
      cleaner: { include: { cleanerProfile: true } },
      jobRequest: true,
      messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    },
  });
  if (!bid) notFound();

  const cleanerName = getProviderName(bid);
  const job = bid.jobRequest;
  const accepted = bid.status === BidStatus.ACCEPTED;
  const completed = job.status === JobRequestStatus.COMPLETED;
  const isHourly = bid.pricingType === BidPricingType.HOURLY && bid.hourlyRateCents && !bid.offerType;
  const estimatedTotalCents = isHourly ? getBidEstimatedTotalCents(bid) : null;
  const closedReason = job.status === JobRequestStatus.EXPIRED ? "This job has ended" : job.status === JobRequestStatus.DELETED ? "This job was removed" : job.status === JobRequestStatus.CANCELLED ? "This job was cancelled" : bid.status === BidStatus.DECLINED || bid.status === BidStatus.WITHDRAWN ? "This conversation is closed" : null;

  return (
    <div className="wk-app-screen wk-message-detail-screen">
      <ActivityReadMarker bidId={bid.id} role="customer" />
      <AppScreenHeader brandHref="/customer" />

      <div className="wk-screen-content wk-message-detail-content">
        <h1 className="sr-only">Conversation with {cleanerName}</h1>
        <div className="wk-conversation-top">
          <Link className="wk-conversation-back" aria-label="Back to messages" href="/customer/messages"><ArrowLeft aria-hidden="true" /></Link>
          <div className="wk-conversation-bid">
            <BidReceivedTime createdAt={bid.createdAt} />
            <BidSummary
              address={formatAddress(job)}
              arrivalTime={bid.arrivalWindowStart}
              cleanerName={cleanerName}
              estimatedHours={bid.estimatedHours}
              estimatedTotal={estimatedTotalCents ? formatCurrency(estimatedTotalCents) : null}
              jobDate={bid.arrivalDate ?? job.requestedDate}
              jobId={getJobReference(job)}
              priceLabel={isHourly ? `${formatCurrency(bid.hourlyRateCents!)}/hr` : formatBidAmount(bid)}
            />
          </div>
        </div>

        <ConversationThread
          bidId={bid.id}
          chosenAt={accepted ? job.acceptedAt?.toISOString() : null}
          chosenText={completed ? "Thanks again—the cleaning is complete." : undefined}
          conversationRef={getConversationReference(bid)}
          closedReason={closedReason}
          initialMessages={[...initialBidMessage(bid), ...bid.messages.map(toThreadMessage)]}
          role="customer"
          smsOnly={!bid.cleanerId && !bid.cleanerLead?.linkedCleanerUserId && Boolean(bid.cleanerLeadId)}
          smsReady={isConversationSmsReady() && !bid.cleanerLead?.optedOutAt}
        />

        <div className="wk-conversation-actions">
          {accepted ? (
            <div className="wk-conversation-chosen"><Check aria-hidden="true" /> Cleaner chosen</div>
          ) : closedReason ? (
            <div className="wk-conversation-closed" role="status"><strong>{job.status === JobRequestStatus.DELETED ? "Job removed" : job.status === JobRequestStatus.EXPIRED || job.status === JobRequestStatus.CANCELLED ? "Job ended" : "Conversation closed"}</strong><span>{job.status === JobRequestStatus.EXPIRED ? "No cleaner was selected before the deadline." : job.status === JobRequestStatus.DELETED ? "This job was removed." : closedReason}</span>{job.status === JobRequestStatus.EXPIRED ? <Link href={`/customer/jobs/new?repost=${job.id}`}>Post again</Link> : null}</div>
          ) : (
            <ProviderSelectionDrawer bidId={bid.id} jobId={job.id} jobTitle={job.title} price={formatBidAmount(bid)} providerName={cleanerName} timing={formatBidTiming(bid)} triggerLabel="Choose this cleaner" />
          )}
        </div>
      </div>
    </div>
  );
}

function formatAddress(job: { addressLine1: string; addressLine2: string | null; city: string; state: string; postalCode: string }) {
  return [job.addressLine1, job.addressLine2, `${job.city}, ${job.state} ${job.postalCode}`].filter(Boolean).join(", ");
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}
