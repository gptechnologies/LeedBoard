import { JobRequestStatus, UserRole } from "@prisma/client";
import { ActivityScreen, type ActivityConversation, type ActivityJob } from "@/components/marketplace/activity-screen";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { formatTimeAgo } from "@/lib/format";
import { formatTimingSummary, getCustomerHomeData } from "@/lib/marketplace";
import { getCleaningJobTitle } from "@/lib/job-title";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerJobsPage() {
  const user = await requireUser(UserRole.CUSTOMER);
  const { jobs } = await getCustomerHomeData(user.id);
  const conversations = buildConversations(jobs);
  const activityJobs: ActivityJob[] = jobs
    .filter(
      (job) =>
        job.status !== JobRequestStatus.COMPLETED &&
        job.status !== JobRequestStatus.CANCELLED,
    )
    .map((job) => ({
      action:
        job.status === JobRequestStatus.OPEN
          ? job.bids.length > 0
            ? `Review ${job.bids.length} ${job.bids.length === 1 ? "bid" : "bids"}`
            : "Waiting for responses"
          : "Review active job",
      href:
        job.status === JobRequestStatus.OPEN
          ? `/customer/jobs/${job.id}/bids`
          : `/customer/jobs/${job.id}`,
      id: job.id,
      location: `${job.city}, ${job.state}`,
      progress: job.status === JobRequestStatus.OPEN ? (job.bids.length > 0 ? 50 : 26) : 75,
      status:
        job.status === JobRequestStatus.OPEN
          ? job.bids.length > 0
            ? "Review responses"
            : "Accepting bids"
          : "Booked",
      timing: formatTimingSummary(job),
      title: getCleaningJobTitle(job),
    }));

  return (
    <div className="wk-app-screen wk-activity-screen">
      <AppScreenHeader
        actionHref="/customer/account"
        actionLabel="Notification settings"
        actionType="notifications"
      />
      <div className="wk-screen-content">
        <h1 className="wk-page-title">Activity</h1>
        <ActivityScreen conversations={conversations} emptyAction={{ href: "/customer/jobs/new", label: "Post a job" }} jobs={activityJobs} />
      </div>
    </div>
  );
}

function buildConversations(
  jobs: Awaited<ReturnType<typeof getCustomerHomeData>>["jobs"],
): ActivityConversation[] {
  const seen = new Set<string>();
  const conversations: ActivityConversation[] = [];

  for (const job of jobs) {
    const bids = job.acceptedBid
      ? [job.acceptedBid, ...job.bids.filter((bid) => bid.id !== job.acceptedBid?.id)]
      : job.bids;
    for (const bid of bids) {
      if (seen.has(bid.id)) continue;
      seen.add(bid.id);
      const cleanerName =
        bid.cleaner.cleanerProfile?.businessName ||
        `${bid.cleaner.firstName} ${bid.cleaner.lastName}`;
      conversations.push({
        avatar: cleanerName
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join("")
          .toUpperCase(),
        href: `/customer/messages/${bid.id}`,
        id: bid.id,
        name: cleanerName,
        preview: bid.message || "A provider sent a new bid for your job.",
        service: getCleaningJobTitle(job),
        time: formatTimeAgo(bid.createdAt),
        unread: bid.customerViewedAt ? undefined : 1,
      });
    }
  }

  return conversations.slice(0, 8);
}
