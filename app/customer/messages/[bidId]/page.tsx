import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityReadMarker } from "@/components/marketplace/activity-read-marker";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { MessageComposer } from "@/components/marketplace/message-composer";
import { ProviderSelectionDrawer } from "@/components/marketplace/provider-selection-drawer";
import { getCleaningJobTitle } from "@/lib/job-title";
import { formatBidAmount, formatBidTiming, formatTimingSummary } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { getJobReference, getProviderName, getProviderPhone } from "@/lib/providers";
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
    },
  });
  if (!bid) notFound();

  const cleanerName = getProviderName(bid);
  const providerPhone = getProviderPhone(bid);
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const providerInitials = getInitials(cleanerName);
  const job = bid.jobRequest;
  const accepted = bid.status === BidStatus.ACCEPTED;
  const completed = job.status === JobRequestStatus.COMPLETED;

  return (
    <div className="wk-app-screen wk-message-detail-screen">
      <ActivityReadMarker bidId={bid.id} role="customer" />
      <AppScreenHeader actionHref="/customer/account" actionLabel="Open account" actionType="initials" brandHref="/customer" initials={initials} />

      <div className="wk-screen-content wk-message-detail-content">
        <header className="wk-conversation-header">
          <Link aria-label="Back to messages" href="/customer/messages"><ArrowLeft aria-hidden="true" /></Link>
          <span className="wk-conversation-header__avatar" aria-hidden="true">{providerInitials}</span>
          <span className="wk-conversation-header__copy">
            <strong>{cleanerName}</strong>
          </span>
        </header>

        <section className="wk-conversation-job" aria-labelledby="conversation-job-title">
          <div className="wk-conversation-job__icon" aria-hidden="true">✦</div>
          <div className="wk-conversation-job__main">
            <div className="wk-conversation-job__title-row">
              <h1 id="conversation-job-title">{getCleaningJobTitle(job)}</h1>
              <span>From this conversation</span>
            </div>
            <p>{formatTimingSummary(job)}</p>
            <p>{formatAddress(job)}</p>
            <div><strong>{formatBidAmount(bid)} bid</strong><span>Job ID: {getJobReference(job)}</span></div>
          </div>
        </section>

        <section className="wk-conversation-thread" aria-label={`Conversation with ${cleanerName}`}>
          <p className="wk-conversation-day">Today</p>
          <article className="wk-chat-line is-provider">
            <span aria-hidden="true">{providerInitials}</span>
            <div>
              <p>{bid.message || `I’m available for ${formatTimingSummary(job)} and would be happy to help.`}</p>
              <time>{formatMessageTime(bid.createdAt)}</time>
            </div>
          </article>
          {accepted ? (
            <article className="wk-chat-line is-customer">
              <div>
                <p>{completed ? "Thanks again—the cleaning is complete." : "Great, I’ve chosen you for this job."}</p>
                <time>{completed ? "Completed" : "Chosen"} <Check aria-hidden="true" /></time>
              </div>
            </article>
          ) : null}
        </section>

        <div className="wk-conversation-actions">
          <MessageComposer phone={providerPhone} />
          {accepted ? (
            <div className="wk-conversation-chosen"><Check aria-hidden="true" /> Cleaner chosen</div>
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

function getInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatMessageTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
