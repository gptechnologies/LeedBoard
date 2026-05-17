import Link from "next/link";
import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { BidCard } from "@/components/marketplace/cards";
import { HomeownerOpenJobDetailCard } from "@/components/marketplace";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  error?: string;
}>;

export default async function CustomerJobDetailPage({
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
      acceptedBid: {
        include: {
          cleaner: {
            include: {
              cleanerProfile: true,
            },
          },
        },
      },
      bids: {
        where: {
          status: BidStatus.SUBMITTED,
        },
      },
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

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        {query.error ? <div className="notice error">{query.error}</div> : null}

        <HomeownerOpenJobDetailCard
          action={
            job.status === JobRequestStatus.OPEN ? (
              <form action={`/customer/jobs/${job.id}/delete`} method="post">
                <button
                  type="submit"
                  className="customer-open-job-delete"
                  aria-label="Delete job"
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </form>
            ) : null
          }
          job={job}
        />

        {job.acceptedBid ? (
          <section className="stack">
            <div className="market-section-heading">
              <h2>Accepted bid</h2>
            </div>
            <BidCard bid={job.acceptedBid} />
          </section>
        ) : (
          <section className="stack">
            <div className="market-section-heading">
              <h2>Bids ({job.bids.length})</h2>
              {job.bids.length > 0 ? (
                <Link href={`/customer/jobs/${job.id}/bids`}>Review Bids</Link>
              ) : null}
            </div>
          </section>
        )}

        {job.status === JobRequestStatus.OPEN ? (
          <aside className="market-bottom-action">
            <div>
              <strong>
                {job.bids.length > 0
                  ? `${job.bids.length} active ${job.bids.length === 1 ? "bid" : "bids"}`
                  : "Collecting bids"}
              </strong>
              <span>
                {job.bids.length > 0
                  ? "Review the strongest cleaner options."
                  : "We will surface the best matches here."}
              </span>
            </div>
            {job.bids.length > 0 ? (
              <Link href={`/customer/jobs/${job.id}/bids`} className="button-link">
                Review Bids
              </Link>
            ) : null}
          </aside>
        ) : null}
      </section>
    </div>
  );
}
