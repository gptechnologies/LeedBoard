import { BidStatus, UserRole } from "@prisma/client";

import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { HomeownerMessagesInbox, type HomeownerConversation } from "@/components/marketplace/homeowner-messages-inbox";
import { getCleaningJobTitle } from "@/lib/job-title";
import { prisma } from "@/lib/prisma";
import { getProviderName } from "@/lib/providers";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerMessagesPage() {
  const user = await requireUser(UserRole.CUSTOMER);
  const bids = await prisma.jobBid.findMany({
    where: { jobRequest: { customerId: user.id } },
    include: {
      cleanerLead: true,
      cleaner: { include: { cleanerProfile: true } },
      jobRequest: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const conversations: HomeownerConversation[] = bids.map((bid) => {
    const name = getProviderName(bid);
    const isChosen = bid.status === BidStatus.ACCEPTED;
    const isNew = bid.status === BidStatus.SUBMITTED && !bid.customerViewedAt;
    return {
      avatar: getAvatar(name),
      href: `/customer/messages/${bid.id}`,
      id: bid.id,
      name,
      preview: bid.message || `${getCleaningJobTitle(bid.jobRequest)} · ${getStatusLabel(bid.status)}`,
      status: isChosen ? "Chosen" : isNew ? "New" : "Bid sent",
      statusTone: isChosen ? "chosen" : isNew ? "new" : "sent",
      time: formatMessageTime(bid.updatedAt),
    };
  });

  return (
    <div className="wk-app-screen wk-messages-screen">
      <AppScreenHeader actionHref="/customer/account" actionLabel="Open account" actionType="initials" brandHref="/customer" initials={initials} />
      <div className="wk-screen-content wk-messages-content">
        <HomeownerMessagesInbox conversations={conversations} />
      </div>
    </div>
  );
}

function getAvatar(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getStatusLabel(status: BidStatus) {
  if (status === BidStatus.ACCEPTED) return "Cleaner chosen";
  if (status === BidStatus.DECLINED) return "Offer declined";
  if (status === BidStatus.WITHDRAWN) return "Offer withdrawn";
  return "Offer received";
}

function formatMessageTime(date: Date) {
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
