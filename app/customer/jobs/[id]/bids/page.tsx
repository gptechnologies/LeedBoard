import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { BidCard } from "@/components/marketplace/cards";
import { HomeownerOpenJobDetailCard } from "@/components/marketplace";
import { ProviderSelectionDrawer } from "@/components/marketplace/provider-selection-drawer";
import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";
import {
  formatBidAmount,
  formatBidTiming,
  getBidSelectionPriorityLabel,
  getPrimaryBidHighlight,
  rankVisibleBids,
} from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  error?: string;
}>;

export default async function CustomerJobBidsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser(UserRole.CUSTOMER);
  const { id } = await params;
  const query = await searchParams;
  const job = await prisma.jobRequest.findFirst({
    where: {
      id,
      customerId: user.id,
    },
    include: {
      bids: {
        include: {
          cleanerLead: true,
          cleaner: {
            include: {
              cleanerProfile: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      acceptedBid: true,
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
  });

  if (!job) {
    notFound();
  }

  if (job.status !== JobRequestStatus.OPEN) {
    redirect(`/customer/jobs/${job.id}`);
  }

  const activeBids = rankVisibleBids(
    job.bids.filter((bid) => bid.status === BidStatus.SUBMITTED),
    job.selectionPriority,
  );
  const visibleBids = activeBids.slice(0, 3);
  const primaryHighlight = getPrimaryBidHighlight(job.selectionPriority);

  return (
    <div className="wk-app-screen wk-homeowner-detail-screen">
      <main className="wk-screen-content">
        <header className="wk-homeowner-detail-heading">
          <Link href="/customer/jobs"><ChevronLeft aria-hidden="true" />Back to Activity</Link>
          <div><h1>Compare bids</h1><p>Review price, timing, and trust details before choosing.</p></div>
        </header>
        {query.error ? <div className="notice error">{query.error}</div> : null}

        <HomeownerOpenJobDetailCard
          action={
            <form action={`/customer/jobs/${job.id}/delete`} method="post">
              <button
                type="submit"
                className="customer-open-job-delete"
                aria-label="Delete job"
              >
                <Trash2 aria-hidden="true" />
              </button>
            </form>
          }
          job={job}
        />

        <section className="stack">
          <div className="market-section-heading">
            <h2>Bids ({activeBids.length})</h2>
            <span className="market-card__meta">
              Ranked for {getBidSelectionPriorityLabel(job.selectionPriority).toLowerCase()}
            </span>
          </div>
        </section>

        {activeBids.length > 0 ? (
          <div className="stack">
            {visibleBids.map((bid, index) => (
              <div key={bid.id} className={index === 0 ? "market-featured-bid" : undefined}>
                {index === 0 ? <span className="best-value-flag">{primaryHighlight}</span> : null}
                <BidCard
                  bid={bid}
                  action={
                    <div className="bid-card-actions">
                      <Link className="button-link secondary" href={`/customer/messages/${bid.id}`}>
                        View bid details
                      </Link>
                      <ProviderSelectionDrawer
                        bidId={bid.id}
                        jobId={job.id}
                        jobTitle={job.title}
                        price={formatBidAmount(bid)}
                        providerName={
                          bid.cleanerLead?.businessName ||
                          bid.cleanerLead?.name ||
                          bid.cleaner?.cleanerProfile?.businessName ||
                          (bid.cleaner
                            ? `${bid.cleaner.firstName} ${bid.cleaner.lastName}`
                            : "Local cleaning provider")
                        }
                        timing={formatBidTiming(bid)}
                      />
                    </div>
                  }
                />
              </div>
            ))}
            {activeBids.length > visibleBids.length ? (
              <div className="notice">
                Showing the top {visibleBids.length} bids ranked for {getBidSelectionPriorityLabel(job.selectionPriority).toLowerCase()}.
              </div>
            ) : null}
          </div>
        ) : null}

        {activeBids.length > 0 ? <p className="wk-homeowner-trust-note">Cleaners are reviewed before they can bid.</p> : null}
      </main>
    </div>
  );
}
