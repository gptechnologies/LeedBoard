import { BidStatus, UserRole } from "@prisma/client";
import Link from "next/link";

import { StatusPill } from "@/components/marketplace/status-pill";
import { getCleaningJobTitle } from "@/lib/job-title";
import { formatBidAmount } from "@/lib/marketplace";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerMessagesPage() {
  const user = await requireUser(UserRole.CUSTOMER);

  const bids = await prisma.jobBid.findMany({
    where: {
      jobRequest: {
        customerId: user.id,
      },
      OR: [
        { status: BidStatus.ACCEPTED },
        {
          messageThread: {
            isNot: null,
          },
        },
      ],
    },
    include: {
      cleaner: true,
      jobRequest: {
        include: {
          homeProfile: {
            select: {
              propertyType: true,
            },
          },
        },
      },
      messageThread: {
        include: {
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 20,
  });

  const conversations = bids.map((bid) => {
    const cleanerName = `${bid.cleaner.firstName} ${bid.cleaner.lastName}`;
    const latestMessage = bid.messageThread?.messages[0]?.body;

    return {
      id: bid.id,
      cleanerName,
      cleanerInitial: bid.cleaner.firstName.charAt(0),
      jobTitle: getCleaningJobTitle(bid.jobRequest),
      preview: latestMessage || `${formatBidAmount(bid)} accepted bid`,
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
              Accepted bids will appear here so you and the cleaner can confirm details.
            </p>
          </section>
        ) : (
          <div className="cleaner-conversations">
            {conversations.map((convo) => (
              <Link
                key={convo.id}
                href={`/customer/messages/${convo.id}`}
                className="cleaner-convo-card"
              >
                <span className="cleaner-convo-avatar" aria-hidden="true">
                  {convo.cleanerInitial}
                </span>
                <div className="cleaner-convo-body">
                  <div className="cleaner-convo-topline">
                    <strong>{convo.cleanerName}</strong>
                    <StatusPill label="Accepted" tone="success" />
                  </div>
                  <span className="cleaner-convo-preview">
                    {convo.jobTitle} · {convo.preview}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
