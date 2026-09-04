import Link from "next/link";
import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { BidCard } from "@/components/marketplace/cards";
import { HomeownerOpenJobDetailCard } from "@/components/marketplace";
import { CancelJobAction } from "@/components/marketplace/cancel-job-action";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  error?: string;
  posted?: string;
  updated?: string;
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
          cleanerLead: true,
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
    <div className="wk-app-screen wk-homeowner-detail-screen">
      <div className="wk-screen-content">
        <header className="wk-homeowner-detail-heading">
          <Link href="/customer/jobs"><ChevronLeft aria-hidden="true" />Back to Activity</Link>
          <div><h1>Job details</h1><p>Track responses and choose a cleaner when you are ready.</p></div>
        </header>
        {query.posted === "1" ? (
          <div className="notice success" role="status">
            <strong>Job published.</strong> Nearby cleaners can review it now. We’ll email you when
            an offer arrives.
          </div>
        ) : null}
        {query.updated === "1" ? (
          <div className="notice success" role="status">Matching preferences updated.</div>
        ) : null}
        {query.error ? <div className="notice error">{query.error}</div> : null}

        <HomeownerOpenJobDetailCard
          action={
            job.status === JobRequestStatus.OPEN ? (
              <CancelJobAction jobId={job.id} />
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
      </div>
    </div>
  );
}
