import { UserRole } from "@prisma/client";
import { BidCard } from "@/components/marketplace/cards";
import { MobileNav } from "@/components/marketplace/mobile-nav";
import { getCleanerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CleanerBidsPage() {
  const user = await requireUser(UserRole.CLEANER);
  const { bids } = await getCleanerHomeData(user.id);

  return (
    <div className="market-shell">
      <section className="market-surface">
        <header className="market-topbar">
          <div>
            <div className="market-kicker">My bids</div>
            <h1>Track your submitted quotes.</h1>
          </div>
        </header>

        {bids.length === 0 ? (
          <section className="market-empty">
            <strong>No bids yet.</strong>
            <p className="market-card__copy">
              Submit your first quote from the open jobs feed.
            </p>
          </section>
        ) : (
          <div className="stack">
            {bids.map((bid) => (
              <BidCard key={bid.id} bid={bid} />
            ))}
          </div>
        )}
      </section>
      <MobileNav role="cleaner" />
    </div>
  );
}
