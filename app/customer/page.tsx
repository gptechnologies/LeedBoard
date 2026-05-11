import Link from "next/link";
import { UserRole } from "@prisma/client";
import {
  HomeownerOpenJobCard,
  HomeownerOpenJobsCarousel,
  PulsatingPrimaryLink,
} from "@/components/marketplace";

import { getCustomerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CustomerDashboardProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CustomerDashboard({ searchParams }: CustomerDashboardProps) {
  const user = await requireUser(UserRole.CUSTOMER);
  const params = await searchParams;
  const { jobs } = await getCustomerHomeData(user.id);
  const openJobs = jobs.slice(0, 3);

  return (
    <div className="market-shell">
      <section className="market-surface">
        {params.error ? <div className="notice error">{params.error}</div> : null}

        <PulsatingPrimaryLink href="/customer/jobs/new" className="customer-post-job-cta">
          <span className="market-hero-icon customer-post-job-cta__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m4 11 8-7 8 7" />
              <path d="M6.5 10.5V20h11v-9.5" />
              <path d="M10 20v-5h4v5" />
              <path d="M17 4v4" />
              <path d="M15 6h4" />
            </svg>
          </span>
          <span className="customer-post-job-cta__copy">
            <strong>Post a Cleaning Job</strong>
            <span>Get bids and choose your cleaner.</span>
          </span>
        </PulsatingPrimaryLink>

        <section className="stack">
          <div className="market-section-heading">
            <h2>Open Jobs ({jobs.length})</h2>
            {jobs.length > 0 ? <Link href="/customer/jobs">View all &gt;</Link> : null}
          </div>
          {openJobs.length > 1 ? (
            <HomeownerOpenJobsCarousel>
              {openJobs.map((job) => (
                <HomeownerOpenJobCard
                  key={job.id}
                  job={job}
                  href={
                    job.status === "OPEN"
                      ? `/customer/jobs/${job.id}/bids`
                      : `/customer/jobs/${job.id}`
                  }
                />
              ))}
            </HomeownerOpenJobsCarousel>
          ) : openJobs.length === 1 ? (
            <HomeownerOpenJobCard
              job={openJobs[0]}
              href={
                openJobs[0].status === "OPEN"
                  ? `/customer/jobs/${openJobs[0].id}/bids`
                  : `/customer/jobs/${openJobs[0].id}`
              }
            />
          ) : null}
        </section>

        <section className="stack">
          <div className="market-section-heading">
            <h2>How it works</h2>
          </div>
          <div className="how-it-works">
            <article>
              <span>1</span>
              <strong>Post job</strong>
              <p>Tell cleaners what you need and when.</p>
            </article>
            <article>
              <span>2</span>
              <strong>Receive bids</strong>
              <p>Vetted cleaners submit their best offers.</p>
            </article>
            <article>
              <span>3</span>
              <strong>Book with confidence</strong>
              <p>Choose the cleaner that fits your job.</p>
            </article>
          </div>
        </section>

        <section className="trust-panel">
          <div className="trust-panel__seal" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z" />
              <path d="m8.5 12 2.2 2.2 4.8-5" />
            </svg>
          </div>
          <div>
            <strong>Vetted cleaning businesses</strong>
            <p>Every cleaner is reviewed before they can bid on your job.</p>
          </div>
        </section>

      </section>
    </div>
  );
}
