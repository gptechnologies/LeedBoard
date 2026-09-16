import { BidPricingType, BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { ArrowLeft, CalendarDays, Check, CircleDollarSign, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityReadMarker } from "@/components/marketplace/activity-read-marker";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { ConversationThread } from "@/components/marketplace/conversation-thread";
import { ConnectionHandoff } from "@/components/marketplace/connection-handoff";
import { ProviderSelectionDrawer } from "@/components/marketplace/provider-selection-drawer";
import { getCleaningJobTitle } from "@/lib/job-title";
import { initialBidMessage, toThreadMessage } from "@/lib/conversation";
import { formatBidAmount, formatBidTiming, formatTimingSummary, getBidEstimatedTotalCents } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { getConversationReference, getJobReference, getProviderName } from "@/lib/providers";
import { isConversationSmsReady } from "@/lib/sms";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = Promise<{ bidId: string }>;

export default async function CustomerMessageThreadPage({ params }: { params: Params }) {
  const user = await requireUser(UserRole.CUSTOMER);
  const { bidId } = await params;
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
  const providerInitials = getInitials(cleanerName);
  const job = bid.jobRequest;
  const accepted = bid.status === BidStatus.ACCEPTED;
  const completed = job.status === JobRequestStatus.COMPLETED;
  const isHourly = bid.pricingType === BidPricingType.HOURLY && bid.hourlyRateCents && !bid.offerType;
  const estimatedTotalCents = isHourly ? getBidEstimatedTotalCents(bid) : null;

  return (
    <div className="wk-app-screen wk-message-detail-screen">
      <ActivityReadMarker bidId={bid.id} role="customer" />
      <AppScreenHeader brandHref="/customer" />

      <div className="wk-screen-content wk-message-detail-content">
        <div className="wk-conversation-top">
          <Link className="wk-conversation-back" aria-label="Back to messages" href="/customer/messages"><ArrowLeft aria-hidden="true" /></Link>
          <section className="wk-conversation-job" aria-labelledby="conversation-job-title">
            <div className="wk-conversation-job__identity">
              <span className="wk-conversation-job__avatar" aria-hidden="true">{providerInitials}</span>
              <div className="wk-conversation-job__name">
                <strong>{cleanerName}</strong>
                <h1 id="conversation-job-title">{getCleaningJobTitle(job)} <span>Bid</span></h1>
              </div>
              <span className="wk-conversation-job__reference">Job ID: {getJobReference(job)}</span>
            </div>
            <div className="wk-conversation-job__context">
              <p><CalendarDays aria-hidden="true" /><span>{formatTimingSummary(job).replace(" - ", " – ")}</span></p>
              <p><MapPin aria-hidden="true" /><span>{formatAddress(job)}</span></p>
            </div>
            <div className="wk-conversation-job__summary">
              <div className="wk-conversation-job__price"><CircleDollarSign aria-hidden="true" /><strong>{isHourly ? `${formatCurrency(bid.hourlyRateCents!)}/hr` : formatBidAmount(bid)}</strong></div>
              {isHourly && bid.estimatedHours ? (
                <div className="wk-conversation-job__hours"><Clock3 aria-hidden="true" /><span>Est. {formatHours(bid.estimatedHours)} hrs</span></div>
              ) : null}
              {estimatedTotalCents ? <strong className="wk-conversation-job__total">Est. total {formatCurrency(estimatedTotalCents)}</strong> : null}
            </div>
          </section>
        </div>

        <ConversationThread
          bidId={bid.id}
          chosenAt={accepted ? job.acceptedAt?.toISOString() : null}
          chosenText={completed ? "Thanks again—the cleaning is complete." : undefined}
          otherInitials={providerInitials}
          conversationRef={getConversationReference(bid)}
          disabled={Boolean(bid.conversationClosedAt) || bid.status === BidStatus.ACCEPTED || bid.status === BidStatus.DECLINED || bid.status === BidStatus.WITHDRAWN || job.status === JobRequestStatus.CANCELLED || job.status === JobRequestStatus.EXPIRED}
          initialMessages={[...initialBidMessage(bid), ...bid.messages.map(toThreadMessage)]}
          role="customer"
          smsOnly={!bid.cleanerId && !bid.cleanerLead?.linkedCleanerUserId && Boolean(bid.cleanerLeadId)}
          smsReady={isConversationSmsReady() && !bid.cleanerLead?.optedOutAt}
        />

        {accepted ? (
          <ConnectionHandoff
            address={formatAddress(job)}
            homeownerName={`${user.firstName} ${user.lastName}`.trim()}
            homeownerPhone={user.phone}
            providerName={cleanerName}
            providerPhone={bid.cleanerLead?.phone || bid.cleaner?.phone || null}
          />
        ) : null}

        <div className="wk-conversation-actions">
          {accepted ? (
            <div className="wk-conversation-chosen"><Check aria-hidden="true" /> Cleaner chosen</div>
          ) : (
            <ProviderSelectionDrawer bidId={bid.id} homeownerPhone={user.phone} jobId={job.id} jobTitle={job.title} price={formatBidAmount(bid)} providerName={cleanerName} timing={formatBidTiming(bid)} triggerLabel="Choose this cleaner" />
          )}
        </div>
      </div>
    </div>
  );
}

function formatAddress(job: { addressLine1: string; addressLine2: string | null; city: string; state: string; postalCode: string }) {
  return [job.addressLine1, job.addressLine2, `${job.city}, ${job.state} ${job.postalCode}`].filter(Boolean).join(", ");
}

function getInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

function formatHours(hours: number) {
  return hours.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
