import { UserRole } from "@prisma/client";
import { AvailableJobCard, BidCard } from "@/components/marketplace/cards";
import { CleanerDefaultsForm } from "@/components/marketplace/cleaner-defaults-form";
import { MobileNav } from "@/components/marketplace/mobile-nav";
import { getCleanerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CleanerDashboardProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CleanerDashboard({ searchParams }: CleanerDashboardProps) {
  const user = await requireUser(UserRole.CLEANER);
  const params = await searchParams;
  const { cleaner, openJobs, bids } = await getCleanerHomeData(user.id);

  return (
    <div className="market-shell">
      <section className="market-surface">
        <header className="market-topbar">
          <div>
            <div className="market-kicker">Cleaner workspace</div>
            <h1>Review open jobs and submit bids.</h1>
          </div>
          <form action="/cleaner/availability" method="post">
            <input
              type="hidden"
              name="isAvailable"
              value={user.cleanerProfile?.isAvailable ? "false" : "true"}
            />
            <button type="submit" className="secondary-submit market-pill-button">
              {user.cleanerProfile?.isAvailable ? "Pause" : "Available"}
            </button>
          </form>
        </header>

        {params.error ? <div className="notice error">{params.error}</div> : null}

        <CleanerDefaultsForm
          defaults={{
            standardHourlyRateCents: cleaner?.cleanerProfile?.standardHourlyRateCents ?? null,
            standardFlatRateCents: cleaner?.cleanerProfile?.standardFlatRateCents ?? null,
            standardDeepCleanFlatRateCents:
              cleaner?.cleanerProfile?.standardDeepCleanFlatRateCents ?? null,
            defaultEtaMinutes: cleaner?.cleanerProfile?.defaultEtaMinutes ?? null,
          }}
        />

        <section className="stack">
          <div className="market-section-heading">
            <h2>Available Jobs</h2>
            <span>{openJobs.length} matches</span>
          </div>
          {openJobs.length === 0 ? (
            <section className="market-empty">
              <strong>No open jobs right now.</strong>
              <p className="market-card__copy">
                New requests that match your service area and specialties will show here.
              </p>
            </section>
          ) : (
            <div className="stack">
              {openJobs.map((job) => (
                <AvailableJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        <section className="stack">
          <div className="market-section-heading">
            <h2>My Bids</h2>
            <span>{bids.length} submitted</span>
          </div>
          {bids.length === 0 ? (
            <section className="market-empty">
              <strong>No bids submitted yet.</strong>
              <p className="market-card__copy">
                Your recent quotes and accepted jobs will appear here.
              </p>
            </section>
          ) : (
            <div className="stack">
              {bids.map((bid) => (
                <BidCard key={bid.id} bid={bid} compact />
              ))}
            </div>
          )}
        </section>
      </section>
      <MobileNav role="cleaner" />
    </div>
  );
}
