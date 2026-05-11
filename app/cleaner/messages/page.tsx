import { BidStatus, UserRole } from "@prisma/client";
import Link from "next/link";

import { getBidStatusLabel } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";
import { StatusPill } from "@/components/marketplace/status-pill";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CleanerMessagesPage() {
  const user = await requireUser(UserRole.CLEANER);

  const bids = await prisma.jobBid.findMany({
    where: { cleanerId: user.id },
    include: {
      jobRequest: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const conversations = bids.map((bid) => {
    const tone: "success" | "danger" | "default" =
      bid.status === BidStatus.ACCEPTED
        ? "success"
        : bid.status === BidStatus.DECLINED || bid.status === BidStatus.WITHDRAWN
          ? "danger"
          : "default";

    return {
      id: bid.id,
      jobId: bid.jobRequestId,
      customerName: `${bid.jobRequest.customer.firstName} ${bid.jobRequest.customer.lastName}`,
      customerInitial: bid.jobRequest.customer.firstName.charAt(0),
      jobTitle: bid.jobRequest.title,
      statusLabel: getBidStatusLabel(bid.status),
      tone,
    };
  });

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <h1>Messages</h1>
          </div>
        </header>

        {conversations.length === 0 ? (
          <section className="market-empty">
            <strong>No conversations yet.</strong>
            <p className="market-card__copy">
              When you bid on a job, a conversation with the homeowner will appear here.
            </p>
          </section>
        ) : (
          <div className="cleaner-conversations">
            {conversations.map((convo) => (
              <Link
                key={convo.id}
                href={`/cleaner/jobs/${convo.jobId}`}
                className="cleaner-convo-card"
              >
                <span className="cleaner-convo-avatar" aria-hidden="true">
                  {convo.customerInitial}
                </span>
                <div className="cleaner-convo-body">
                  <div className="cleaner-convo-topline">
                    <strong>{convo.customerName}</strong>
                    <StatusPill label={convo.statusLabel} tone={convo.tone} />
                  </div>
                  <span className="cleaner-convo-preview">{convo.jobTitle}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
