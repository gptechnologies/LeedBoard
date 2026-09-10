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
      <AppScreenHeader
        actionHref="/customer/account"
        actionLabel="Open account"
        actionType="initials"
        brandHref="/customer"
        initials={initials}
        tagline="A cleaner home, happier you"
      />
      <div className="wk-screen-content wk-homeowner-hub">
        <h1 className="sr-only">Home</h1>
        <Link className="wk-homeowner-post-card wk-pressable" href="/customer/jobs/new">
          <span className="wk-homeowner-post-card__icon" aria-hidden="true">
            <Plus />
          </span>
          <span className="wk-homeowner-post-card__copy">
            <strong>Post a job</strong>
            <small>Tell us where and when. Cleaners will send prices.</small>
          </span>
          <ChevronRight aria-hidden="true" />
        </Link>

        <section className="wk-homeowner-job-list" aria-labelledby="homeowner-jobs-heading">
          <div className="wk-homeowner-job-list__heading">
            <h2 id="homeowner-jobs-heading">My jobs</h2>
            {jobs.length > 0 ? <Link href="/customer/jobs">See all</Link> : null}
          </div>

          {jobs.length > 0 ? (
            <div className="wk-homeowner-job-list__items">
              {jobs.slice(0, 3).map((job) => {
                const openOffers = job.bids.length;
                return (
                  <article className="wk-homeowner-job-row" key={job.id}>
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
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="wk-homeowner-jobs-empty">
              <HomeGardenIllustration />
              <strong>No jobs yet</strong>
              <p>Post a job and your request and cleaner bids will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function HomeGardenIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="wk-home-garden-art"
      viewBox="0 0 220 150"
    >
      <path d="M18 127c20-11 37-13 53-7 14 5 21 14 39 13 19-1 27-12 47-14 16-2 31 2 45 9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" opacity=".12" />
      <path d="M76 122V76l35-31 35 31v46" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="3" />
      <path d="M95 121V91h30v30" fill="currentColor" opacity=".12" />
      <circle cx="117" cy="107" r="3" fill="currentColor" />
      <g fill="#7fa987">
        <ellipse cx="50" cy="87" rx="8" ry="18" transform="rotate(-28 50 87)" />
        <ellipse cx="40" cy="108" rx="7" ry="15" transform="rotate(-58 40 108)" />
        <ellipse cx="61" cy="103" rx="7" ry="17" transform="rotate(28 61 103)" />
        <ellipse cx="165" cy="80" rx="8" ry="19" transform="rotate(25 165 80)" />
        <ellipse cx="181" cy="101" rx="7" ry="17" transform="rotate(42 181 101)" />
        <ellipse cx="155" cy="105" rx="7" ry="16" transform="rotate(-28 155 105)" />
      </g>
      <g fill="none" stroke="#4f805d" strokeLinecap="round" strokeWidth="2.5">
        <path d="M58 124C57 104 52 91 48 79M58 113L38 99M58 102l12-17" />
        <path d="M158 124c1-22 7-35 10-52m-8 40 22-24m-20 13-12-17" />
      </g>
      <path d="m183 42 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#f1b95d" />
    </svg>
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
