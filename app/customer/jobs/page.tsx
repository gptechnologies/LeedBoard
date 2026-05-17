import Link from "next/link";
import { UserRole } from "@prisma/client";
import { HomeownerJobSummaryCard } from "@/components/marketplace";

import { getCustomerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerJobsPage() {
  const user = await requireUser(UserRole.CUSTOMER);
  const { jobs } = await getCustomerHomeData(user.id);

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Jobs</div>
            <h1>Your cleaning jobs</h1>
          </div>
          <span className="market-count-pill">{jobs.length} total</span>
        </header>

        {jobs.length === 0 ? (
          <section className="market-empty">
            <strong>No jobs yet</strong>
            <p className="market-card__copy">
              Post a job once, then compare cleaner bids from this tab.
            </p>
            <Link href="/customer/jobs/new" className="button-link">
              Post Job for Bids
            </Link>
          </section>
        ) : (
          <div className="stack">
            {jobs.map((job) => (
              <HomeownerJobSummaryCard
                key={job.id}
                job={job}
                href={
                  job.status === "OPEN"
                    ? `/customer/jobs/${job.id}/bids`
                    : `/customer/jobs/${job.id}`
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
