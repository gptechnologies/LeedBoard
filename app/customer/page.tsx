import { JobRequestStatus, UserRole } from "@prisma/client";
import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { getCustomerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerDashboard() {
  const user = await requireUser(UserRole.CUSTOMER);
  const { jobs } = await getCustomerHomeData(user.id);
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="wk-app-screen wk-homeowner-hub-screen">
      <AppScreenHeader accountMenu initials={initials} />
      <div className="wk-screen-content wk-homeowner-hub">
        <header className="wk-homeowner-hub__heading">
          <h1>Home</h1>
        </header>

        <Link className="wk-homeowner-post-card wk-pressable" href="/customer/jobs/new">
          <span className="wk-homeowner-post-card__icon" aria-hidden="true">
            <Plus />
          </span>
          <span className="wk-homeowner-post-card__copy">
            <strong>Post a job</strong>
            <small>Address, time, notes</small>
          </span>
          <ChevronRight aria-hidden="true" />
        </Link>

        <section className="wk-homeowner-job-list" aria-labelledby="homeowner-jobs-heading">
          <div className="wk-homeowner-job-list__heading">
            <h2 id="homeowner-jobs-heading">Your jobs</h2>
            {jobs.length > 0 ? <Link href="/customer/jobs">See all</Link> : null}
          </div>

          {jobs.length > 0 ? (
            <div className="wk-homeowner-job-list__items">
              {jobs.slice(0, 3).map((job) => {
                const openOffers = job.bids.length;
                return (
                  <Link className="wk-homeowner-job-row wk-pressable" href={`/customer/jobs/${job.id}`} key={job.id}>
                    <span className="wk-homeowner-job-row__date" aria-hidden="true">
                      <CalendarDays />
                    </span>
                    <span className="wk-homeowner-job-row__copy">
                      <strong>{job.title}</strong>
                      <small>{formatJobLine(job.requestedDate, job.createdAt, openOffers)}</small>
                    </span>
                    <span className={`wk-homeowner-job-row__status is-${job.status.toLowerCase()}`}>
                      {getStatusLabel(job.status, openOffers)}
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="wk-homeowner-jobs-empty">
              <span aria-hidden="true"><CalendarDays /></span>
              <strong>No jobs yet</strong>
              <p>Your posted jobs will show up here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function formatJobLine(requestedDate: Date | null, createdAt: Date, offerCount: number) {
  const date = requestedDate ?? createdAt;
  const dateLabel = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (offerCount > 0) {
    return `${dateLabel} · ${offerCount} ${offerCount === 1 ? "offer" : "offers"}`;
  }

  return dateLabel;
}

function getStatusLabel(status: JobRequestStatus, offerCount: number) {
  if (status === JobRequestStatus.AWARDED) return "Booked";
  if (status === JobRequestStatus.COMPLETED) return "Done";
  if (status === JobRequestStatus.CANCELLED) return "Cancelled";
  if (status === JobRequestStatus.EXPIRED) return "Expired";
  return offerCount > 0 ? "Offers" : "Open";
}
