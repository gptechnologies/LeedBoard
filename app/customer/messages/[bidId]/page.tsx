import { money } from "@/lib/homeowner-view";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getProviderName } from "@/lib/providers";
import { initialBidMessage, toThreadMessage } from "@/lib/conversation";
import { formatBidAmount, getDefaultHomeProfile } from "@/lib/marketplace";
import { HomeownerConversation } from "@/components/marketplace/homeowner-conversation";
import { ActivityReadMarker } from "@/components/marketplace/activity-read-marker";
export const dynamic = "force-dynamic";
export default async function Thread({
  params,
  searchParams,
}: {
  params: Promise<{ bidId: string }>;
  searchParams: Promise<{ jobId?: string }>;
}) {
  const u = await requireUser("CUSTOMER");
  const [{ bidId }, p, home] = await Promise.all([
    params,
    searchParams,
    getDefaultHomeProfile(u.id),
  ]);
  const b = await prisma.jobBid.findFirst({
    where: {
      id: bidId,
      jobRequest: { customerId: u.id, status: { not: "DELETED" } },
    },
    include: {
      cleanerLead: true,
      cleaner: { include: { cleanerProfile: true } },
      jobRequest: true,
      messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    },
  });
  if (!b) notFound();
  const j = b.jobRequest;
  const accepted = j.acceptedBidId === b.id && b.status === "ACCEPTED";
  const closed = ["CANCELLED", "EXPIRED", "DELETED"].includes(j.status)
    ? j.status === "CANCELLED"
      ? "Request cancelled"
      : "Request ended"
    : b.status === "DECLINED"
      ? "Not selected"
      : b.status === "WITHDRAWN"
        ? "Bid withdrawn"
        : j.status === "COMPLETED"
          ? "Cleaning completed"
          : null;
  const name = getProviderName(b);
  const back =
    p.jobId === "all"
      ? "/customer/messages"
      : `/customer/messages?jobId=${j.id}`;
  let messages = [...initialBidMessage(b), ...b.messages.map(toThreadMessage)];
  if (b.providerQuestion && !b.message)
    messages = [
      {
        id: "question-" + b.id,
        sender: "CLEANER",
        channel: "APP",
        body: b.providerQuestion,
        deliveryStatus: null,
        createdAt: b.createdAt.toISOString(),
      },
      ...messages,
    ];
  return (
    <>
      <ActivityReadMarker bidId={b.id} role="customer" />
      <HomeownerConversation
        backHref={back}
        initialMessages={messages}
        view={{
          id: b.id,
          jobId: j.id,
          name,
          price:
            b.flatRateCents && (!b.offerType || b.offerType === "FIXED_PRICE")
              ? money(b.flatRateCents)
              : formatBidAmount(b),
          date: b.arrivalDate?.toISOString() ?? null,
          arrival: b.arrivalWindowStart,
          address: j.addressLine1 || `ZIP ${j.postalCode}`,
          notes: b.message,
          scope: `${j.bedroomCount ?? "—"} beds · ${j.bathroomCount ?? "—"} baths · ${j.cleanType?.replaceAll("_", " ").toLowerCase() ?? "home cleaning"}`,
          bidVersion: b.updatedAt.toISOString(),
          canChoose:
            !closed &&
            !accepted &&
            j.status === "OPEN" &&
            !!b.flatRateCents &&
            (!b.offerType || b.offerType === "FIXED_PRICE"),
          accepted,
          completed: j.status === "COMPLETED",
          closedReason: closed,
          phone:
            accepted && !closed
              ? (b.cleanerLead?.phone ?? b.cleaner?.phone ?? null)
              : null,
          firstName: u.firstName,
          street:
            j.addressLine1 ||
            (home?.postalCode === j.postalCode ? home.addressLine1 : ""),
          city: j.city || (home?.postalCode === j.postalCode ? home.city : ""),
          state:
            j.state || (home?.postalCode === j.postalCode ? home.state : ""),
          postalCode: j.postalCode,
          email: u.email ?? "",
          hasPhone: !!u.phone,
        }}
      />
    </>
  );
}
