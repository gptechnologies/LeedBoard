import { OutreachState, UserRole } from "@prisma/client";
import Link from "next/link";

import { getCleaningJobTitle } from "@/lib/job-title";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminAttentionPage() {
  await requireUser(UserRole.ADMIN);
  const jobs = await prisma.jobRequest.findMany({
    where: { outreachState: OutreachState.NEEDS_ATTENTION },
    include: { customer: true, homeProfile: { select: { propertyType: true } } },
    orderBy: [{ needsAttentionAt: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div><div className="market-kicker">Admin</div><h1>Jobs needing help</h1></div>
          <Link href="/admin/outreach" className="button-link secondary">Outreach log</Link>
        </header>

        {jobs.length === 0 ? (
          <section className="market-empty"><strong>No jobs need attention.</strong><p className="market-card__copy">Jobs with no reachable nearby providers will appear here.</p></section>
        ) : (
          <div className="stack">
            {jobs.map((job) => (
              <article className="market-card" key={job.id}>
                <div className="market-card__header">
                  <div className="stack small">
                    <strong>{getCleaningJobTitle(job)}</strong>
                    <span className="market-card__meta">{job.city}, {job.state} {job.postalCode} · {job.customer.email}</span>
                  </div>
                  <span className="status-pill">Needs attention</span>
                </div>
                <p className="market-card__copy">{job.attentionReason || "No nearby provider could be reached."}</p>
                <div className="market-card__actions market-card__actions--start">
                  <form action={`/admin/attention/${job.id}/retry`} method="post"><button className="secondary-submit" type="submit">Retry outreach</button></form>
                  <Link className="button-link secondary" href="/admin/leads">Add provider</Link>
                  <a className="button-link secondary" href={`mailto:${job.customer.email}`}>Email homeowner</a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
