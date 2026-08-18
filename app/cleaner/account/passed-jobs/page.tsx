import { JobRequestStatus, UserRole } from "@prisma/client";
import { CalendarDays, ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";

import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { EmptyState } from "@/components/marketplace/empty-state";
import { RestorePassedJobButton } from "@/components/marketplace/restore-passed-job-button";
import { getCleaningJobTitle } from "@/lib/job-title";
import { formatTimingSummary } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PassedJobsPage() {
  const user = await requireUser(UserRole.CLEANER);
  const businessName = user.cleanerProfile?.businessName || `${user.firstName} ${user.lastName}`;
  const initials = businessName.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
  const passedJobs = await prisma.cleanerJobPass.findMany({
    where: { cleanerId: user.id },
    orderBy: { passedAt: "desc" },
    select: {
      passedAt: true,
      jobRequest: {
        select: {
          id: true,
          title: true,
          city: true,
          state: true,
          postalCode: true,
          serviceNeeds: true,
          roomTypes: true,
          cleanLevel: true,
          cleanType: true,
          currentCondition: true,
          suppliesSource: true,
          timingPreference: true,
          requestedDate: true,
          requestedWindowStart: true,
          requestedWindowEnd: true,
          notes: true,
          status: true,
          createdAt: true,
          homeProfile: {
            select: {
              bedroomCount: true,
              bathroomCount: true,
              estimatedSquareFeet: true,
              storyCount: true,
              hasPets: true,
              propertyType: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="wk-app-screen wk-passed-jobs-screen">
      <AppScreenHeader accountMenu initials={initials} />
      <main className="wk-screen-content">
        <header className="wk-secondary-page-heading">
          <Link aria-label="Back to account" href="/cleaner/account"><ChevronLeft aria-hidden="true" /></Link>
          <div><h1>Passed Jobs</h1><p>Jobs you set aside are kept here.</p></div>
        </header>

        {passedJobs.length ? (
          <div className="wk-passed-jobs-list">
            {passedJobs.map(({ jobRequest: job, passedAt }) => (
              <article className="wk-passed-job" key={job.id}>
                <div className="wk-passed-job__heading">
                  <div><span>Passed {passedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span><h2>{getCleaningJobTitle(job)}</h2></div>
                  <span className={job.status === JobRequestStatus.OPEN ? "is-open" : ""}>{job.status === JobRequestStatus.OPEN ? "Open" : "Closed"}</span>
                </div>
                <div className="wk-passed-job__meta">
                  <span><CalendarDays aria-hidden="true" />{formatTimingSummary(job)}</span>
                  <span><MapPin aria-hidden="true" />{job.city}, {job.state.toUpperCase()} {job.postalCode}</span>
                </div>
                {job.status === JobRequestStatus.OPEN ? <RestorePassedJobButton jobId={job.id} /> : <p className="wk-passed-job__unavailable">This job is no longer accepting bids.</p>}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState body="When you pass on a job, it will remain here so you can move it back later." title="No passed jobs" />
        )}
      </main>
    </div>
  );
}
