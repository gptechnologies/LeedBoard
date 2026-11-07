export type JobActivityInput = {
  status: string;
  bidCount: number;
  cleanersNotifiedCount: number;
  mailState: string;
  acceptedBidId?: string | null;
};

export function canDeletePosting(job: Pick<JobActivityInput, "status" | "acceptedBidId">) {
  return !job.acceptedBidId && ["OPEN", "EXPIRED"].includes(job.status);
}

export function getJobActivity(job: JobActivityInput) {
  const open = job.status === "OPEN";
  const attention = open && ["FAILED", "NO_MATCH"].includes(job.mailState);
  const live = open && !attention;
  const badge = open
    ? attention ? "Needs attention" : "In progress"
    : ({ EXPIRED: "Expired", CANCELLED: "Cancelled", AWARDED: "Cleaner chosen", COMPLETED: "Completed" }[job.status] ?? "Closed");
  const searchTitle = !open
    ? job.status === "AWARDED" || job.status === "COMPLETED" ? "Cleaner selected" : "Search ended"
    : job.mailState === "FAILED" ? "Delivery needs attention"
    : job.mailState === "NO_MATCH" ? "No nearby match yet"
    : job.cleanersNotifiedCount ? "Nearby cleaners contacted" : "Searching nearby cleaners";
  const searchDetail = !open
    ? job.status === "EXPIRED" ? "Post again to start a new search."
      : job.status === "CANCELLED" ? "This posting is no longer active."
      : "Your booking is in your conversations."
    : job.mailState === "FAILED" ? "Your posting is saved. Some invitations could not be delivered."
    : job.mailState === "NO_MATCH" ? "No subscribed cleaner in this ZIP yet."
    : job.cleanersNotifiedCount ? `${job.cleanersNotifiedCount} ${job.cleanersNotifiedCount === 1 ? "cleaner" : "cleaners"} notified`
    : "Checking your area for a match.";
  return {
    live,
    attention,
    badge,
    searchTitle,
    searchDetail,
    bidsTitle: job.bidCount ? `${job.bidCount === 1 ? "Bid" : "Bids"} received` : open ? "Waiting for bids" : "No bids received",
    bidsDetail: job.bidCount ? `${job.bidCount} ${job.bidCount === 1 ? "bid" : "bids"} ${open ? "so far" : "received"}` : open ? "Offers appear as cleaners respond." : "No offers on this posting.",
  };
}
