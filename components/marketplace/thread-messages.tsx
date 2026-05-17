import { BidPricingType, ThreadMessageKind } from "@prisma/client";
import { CheckCircle2, Send } from "lucide-react";

import { formatBidAmount, formatBidTiming, formatClock } from "@/lib/marketplace";

type ThreadBid = {
  pricingType: BidPricingType;
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  estimatedHours?: number | null;
  etaMinutes: number | null;
  arrivalDate: Date | null;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
};

type ThreadJob = {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
};

type ThreadMessage = {
  id: string;
  kind: ThreadMessageKind;
  body: string;
  createdAt: Date;
  senderId: string | null;
  sender: {
    firstName: string;
    lastName: string;
  } | null;
};

export function ThreadMessages({
  bid,
  currentUserId,
  job,
  messages,
}: {
  bid: ThreadBid;
  currentUserId: string;
  job: ThreadJob;
  messages: ThreadMessage[];
}) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="conversation-flow" aria-label="Conversation messages">
      <div className="conversation-day-divider">
        <span>Today</span>
      </div>

      {messages.map((message) =>
        message.kind === ThreadMessageKind.BID_ACCEPTED ? (
          <BidAcceptedMessage key={message.id} bid={bid} job={job} message={message} />
        ) : (
          <UserMessage
            key={message.id}
            isOwnMessage={message.senderId === currentUserId}
            message={message}
          />
        ),
      )}
    </div>
  );
}

export function MessageComposer({ action }: { action: string }) {
  return (
    <form action={action} method="post" className="conversation-composer">
      <label className="sr-only" htmlFor="conversation-message">
        Send message
      </label>
      <textarea
        id="conversation-message"
        name="message"
        placeholder="Send message..."
        rows={1}
        required
      />
      <button type="submit" aria-label="Send message">
        <Send aria-hidden={true} />
      </button>
    </form>
  );
}

function BidAcceptedMessage({
  bid,
  job,
  message,
}: {
  bid: ThreadBid;
  job: ThreadJob;
  message: ThreadMessage;
}) {
  const senderInitial = message.sender?.firstName.charAt(0) ?? "?";

  return (
    <div className="conversation-accepted-row">
      <span className="conversation-avatar" aria-hidden="true">
        {senderInitial}
      </span>
      <article className="conversation-accepted-card">
        <div className="conversation-accepted-card__title">
          <span aria-hidden="true">
            <CheckCircle2 />
          </span>
          <strong>Bid Accepted</strong>
        </div>
        <dl>
          <div>
            <dt>Time:</dt>
            <dd>{formatAcceptedTime(bid)}</dd>
          </div>
          <div>
            <dt>Address:</dt>
            <dd>{formatAddress(job)}</dd>
          </div>
          <div>
            <dt>Price:</dt>
            <dd>{formatBidAmount(bid)}</dd>
          </div>
        </dl>
        <p>{message.body}</p>
        <time>{formatMessageTime(message.createdAt)}</time>
      </article>
    </div>
  );
}

function UserMessage({
  isOwnMessage,
  message,
}: {
  isOwnMessage: boolean;
  message: ThreadMessage;
}) {
  const senderInitial = message.sender?.firstName.charAt(0) ?? "?";

  return (
    <article
      className={`conversation-bubble-row ${isOwnMessage ? "conversation-bubble-row--own" : ""}`}
    >
      {!isOwnMessage ? (
        <span className="conversation-avatar" aria-hidden="true">
          {senderInitial}
        </span>
      ) : null}
      <div>
        <p className="conversation-bubble">{message.body}</p>
        <time>{formatMessageTime(message.createdAt)}</time>
      </div>
      {isOwnMessage ? (
        <span className="conversation-avatar conversation-avatar--own" aria-hidden="true">
          {senderInitial}
        </span>
      ) : null}
    </article>
  );
}

function formatAcceptedTime(bid: ThreadBid) {
  if (bid.arrivalDate && bid.arrivalWindowStart) {
    return `${bid.arrivalDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })} · ${formatClock(bid.arrivalWindowStart)}`;
  }

  return formatBidTiming(bid);
}

function formatAddress(job: ThreadJob) {
  return [
    job.addressLine1,
    job.addressLine2,
    `${job.city}, ${job.state} ${job.postalCode}`,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatMessageTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
