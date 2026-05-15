import { UserRole } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getCleaningJobTitle } from "@/lib/job-title";

export const dynamic = "force-dynamic";

export default async function AdminOutreachPage() {
  await requireUser(UserRole.ADMIN);

  const outreaches = await prisma.jobOutreach.findMany({
    include: {
      cleanerLead: true,
      cleanerUser: {
        include: {
          cleanerProfile: true,
        },
      },
      jobRequest: {
        include: {
          homeProfile: {
            select: {
              propertyType: true,
            },
          },
        },
      },
      bid: true,
      notificationDeliveries: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Admin</div>
            <h1>Outreach Queue</h1>
          </div>
          <span className="market-count-pill">{outreaches.length} rows</span>
        </header>

        {outreaches.length === 0 ? (
          <section className="market-empty">
            <strong>No outreach yet.</strong>
            <p className="market-card__copy">
              New posted jobs will create outreach rows for matching cleaners.
            </p>
          </section>
        ) : (
          <div className="stack">
            {outreaches.map((outreach) => {
              const cleanerName =
                outreach.cleanerLead?.businessName ||
                outreach.cleanerLead?.name ||
                outreach.cleanerUser?.cleanerProfile?.businessName ||
                (outreach.cleanerUser
                  ? `${outreach.cleanerUser.firstName} ${outreach.cleanerUser.lastName}`
                  : "Cleaner");
              const invitePath = `/invite/cleaner/${outreach.interestToken}`;
              const latestDelivery = outreach.notificationDeliveries[0] ?? null;

              return (
                <article key={outreach.id} className="market-card">
                  <div className="market-card__header">
                    <div className="stack small">
                      <strong>{cleanerName}</strong>
                      <span className="market-card__meta">
                        {outreach.channel} · {outreach.status}
                      </span>
                      {outreach.cleanerLead?.phone ? (
                        <span className="market-card__meta">{outreach.cleanerLead.phone}</span>
                      ) : null}
                    </div>
                    <span className="status-pill">{outreach.status.replaceAll("_", " ")}</span>
                  </div>
                  <div className="stack small">
                    <span className="market-card__meta">
                      {getCleaningJobTitle(outreach.jobRequest)} · {outreach.jobRequest.city},{" "}
                      {outreach.jobRequest.state}
                    </span>
                    <span className="market-card__meta">
                      Token expires {outreach.interestTokenExpiresAt.toLocaleDateString("en-US")}
                    </span>
                    {outreach.bid ? (
                      <span className="market-card__meta">Bid submitted</span>
                    ) : null}
                    {latestDelivery ? (
                      <span className="market-card__meta">
                        SMS: {latestDelivery.status}
                        {latestDelivery.failureReason ? ` · ${latestDelivery.failureReason}` : ""}
                      </span>
                    ) : null}
                  </div>
                  <div className="market-card__actions market-card__actions--start">
                    <Link className="button-link secondary" href={invitePath}>
                      Invite Link
                    </Link>
                    <form action={`/admin/outreach/${outreach.id}/mark`} method="post">
                      <input type="hidden" name="status" value="INTERESTED" />
                      <button type="submit" className="secondary-submit">
                        Mark interested
                      </button>
                    </form>
                    {outreach.channel === "SMS" ? (
                      <form action={`/admin/outreach/${outreach.id}/send-sms`} method="post">
                        <button type="submit" className="secondary-submit">
                          Send SMS
                        </button>
                      </form>
                    ) : null}
                    <form action={`/admin/outreach/${outreach.id}/mark`} method="post">
                      <input type="hidden" name="status" value="NOT_INTERESTED" />
                      <button type="submit" className="secondary-submit">
                        Not interested
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
