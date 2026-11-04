import { HomeownerHeader } from "@/components/marketplace/homeowner-shell";
import { HomeownerMessagesInbox } from "@/components/marketplace/homeowner-messages-inbox";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getProviderName } from "@/lib/providers";
import {
  age,
  bidTiming,
  jobTiming,
  money,
  unreadBid,
} from "@/lib/homeowner-view";
import { formatBidAmount } from "@/lib/marketplace";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Messages({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const u = await requireUser("CUSTOMER");
  const p = await searchParams;
  const jobs = await prisma.jobRequest.findMany({
    where: { customerId: u.id, status: { not: "DELETED" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      addressLine1: true,
      postalCode: true,
      publicReference: true,
      requestedDate: true,
      requestedWindowStart: true,
      requestedWindowEnd: true,
    },
  });
  const selected = p.jobId ?? "";
  if (selected && !jobs.some((j) => j.id === selected)) notFound();
  const bids = await prisma.jobBid.findMany({
    where: {
      jobRequest: { customerId: u.id, status: { not: "DELETED" } },
      ...(selected ? { jobRequestId: selected } : {}),
    },
    include: {
      cleanerLead: true,
      cleaner: { include: { cleanerProfile: true } },
      jobRequest: true,
      messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 },
    },
  });
  const rows = bids
    .sort(
      (a, b) =>
        (b.messages[0]?.createdAt ?? b.updatedAt).getTime() -
        (a.messages[0]?.createdAt ?? a.updatedAt).getTime(),
    )
    .map((b) => ({
      id: b.id,
      jobId: b.jobRequestId,
      name: getProviderName(b),
      avatar: getProviderName(b).charAt(0).toUpperCase(),
      price: b.providerQuestion
        ? "Question"
        : b.flatRateCents && (!b.offerType || b.offerType === "FIXED_PRICE")
          ? money(b.flatRateCents)
          : formatBidAmount(b),
      timing: bidTiming(b),
      preview:
        b.messages[0]?.body ||
        b.message ||
        b.providerQuestion ||
        "A cleaning bid for your home.",
      time: age(b.messages[0]?.createdAt ?? b.updatedAt, true),
      unread: unreadBid(b),
      status:
        b.jobRequest.status === "CANCELLED"
          ? "Cancelled"
          : b.jobRequest.status === "EXPIRED"
            ? "Expired"
            : b.status === "ACCEPTED"
              ? "Cleaner chosen"
              : b.status === "DECLINED"
                ? "Not selected"
                : b.status === "WITHDRAWN"
                  ? "Withdrawn"
                  : null,
    }));
  return (
    <>
      <HomeownerHeader />
      <HomeownerMessagesInbox
        conversations={rows}
        jobs={jobs.map((j) => ({
          id: j.id,
          label: `${jobTiming(j)} · ${j.addressLine1 || "ZIP " + j.postalCode} · ${j.publicReference ?? j.id.slice(-4)}`,
        }))}
        selectedJob={selected}
      />
    </>
  );
}
