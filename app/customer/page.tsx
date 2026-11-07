import { HomeownerHeader } from "@/components/marketplace/homeowner-shell";
import { HomeownerJobsWorkspace } from "@/components/marketplace/homeowner-jobs-workspace";
import { getCustomerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function Jobs({
  searchParams,
}: {
  searchParams: Promise<{ compose?: string; repost?: string; limit?: string }>;
}) {
  const user = await requireUser("CUSTOMER");
  const p = await searchParams;
  const limit = Math.min(200, Math.max(20, Number(p.limit) || 20));
  const { jobs, homeProfile } = await getCustomerHomeData(user.id, limit);
  const repost = p.repost
    ? await prisma.jobRequest.findFirst({
        where: { id: p.repost, customerId: user.id },
      })
    : null;
  const visible = jobs.slice(0, limit).map((j) => ({
    id: j.id,
    revision: j.revision,
    publicReference: j.publicReference,
    postalCode: j.postalCode,
    addressLine1: j.addressLine1,
    bedroomCount: j.bedroomCount,
    bathroomCount: j.bathroomCount,
    requestedDate: j.requestedDate,
    requestedWindowStart: j.requestedWindowStart,
    requestedWindowEnd: j.requestedWindowEnd,
    timingPreference: j.timingPreference,
    cleanType: j.cleanType,
    notes: j.notes,
    createdAt: j.createdAt,
    status: j.status,
    acceptedBidId: j.acceptedBidId,
    homeFactsSnapshot: j.homeFactsSnapshot,
    bidCount: j.bids.filter((b) => !b.providerQuestion).length,
    cleanersNotifiedCount: j.cleanersNotifiedCount,
    mailState: j.outreaches.some((o) => o.status === "FAILED")
      ? "FAILED"
      : !j.outreaches.length && Date.now() - j.createdAt.getTime() > 60000
        ? "NO_MATCH"
        : "PENDING",
  }));
  return (
    <>
      <HomeownerHeader />
      <HomeownerJobsWorkspace
        jobs={visible}
        home={homeProfile}
        compose={p.compose === "1" || !!repost}
        repost={repost}
        limit={limit}
        hasMore={jobs.length > limit}
      />
    </>
  );
}
