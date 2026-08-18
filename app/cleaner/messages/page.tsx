import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { ActivityScreen, type ActivityConversation, type ActivityJob } from "@/components/marketplace/activity-screen";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { formatTimeAgo } from "@/lib/format";
import { getCleaningJobTitle } from "@/lib/job-title";
import { formatTimingSummary } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CleanerMessagesPage() {
  const user = await requireUser(UserRole.CLEANER);
  const bids = await prisma.jobBid.findMany({
    where: { cleanerId: user.id },
    include: {
      jobRequest: {
        include: {
          customer: true,
          homeProfile: { select: { propertyType: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const conversations: ActivityConversation[] = bids.map((bid) => {
    const customerName = `${bid.jobRequest.customer.firstName} ${bid.jobRequest.customer.lastName}`;
    return {
      avatar: `${bid.jobRequest.customer.firstName.charAt(0)}${bid.jobRequest.customer.lastName.charAt(0)}`.toUpperCase(),
      href: `/cleaner/messages/${bid.id}`,
      id: bid.id,
      name: customerName,
      preview: bid.message || "Your bid is in. Open the job to review its status.",
      service: getCleaningJobTitle(bid.jobRequest),
      time: formatTimeAgo(bid.createdAt),
      unread:
        bid.status === BidStatus.ACCEPTED && !bid.cleanerViewedAt
          ? 1
          : undefined,
    };
  });
  const activeJobs: ActivityJob[] = bids
    .filter((bid) => bid.jobRequest.status !== JobRequestStatus.COMPLETED)
    .map((bid) => ({
      action: bid.status === BidStatus.ACCEPTED ? "Review active job" : "Bid sent",
      href: `/cleaner/messages/${bid.id}`,
      id: bid.id,
      location: `${bid.jobRequest.city}, ${bid.jobRequest.state}`,
      progress: bid.status === BidStatus.ACCEPTED ? 76 : 44,
      status: bid.status === BidStatus.ACCEPTED ? "Booked" : "Awaiting reply",
      timing: formatTimingSummary(bid.jobRequest),
      title: getCleaningJobTitle(bid.jobRequest),
    }));

  return (
    <div className="wk-app-screen wk-activity-screen">
      <AppScreenHeader
        actionHref="/cleaner/account"
        actionLabel="Notification settings"
        actionType="notifications"
      />
      <div className="wk-screen-content">
        <h1 className="wk-page-title">Messages</h1>
        <ActivityScreen conversations={conversations} emptyAction={{ href: "/cleaner", label: "Browse jobs" }} jobs={activeJobs} jobsLabel="Active Jobs" />
      </div>
    </div>
  );
}
