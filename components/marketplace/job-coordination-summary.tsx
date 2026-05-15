import type { ComponentType } from "react";
import { BidPricingType, BidStatus, EntryMethod, SuppliesSource } from "@prisma/client";
import { Clock3, DollarSign, DoorOpen, Home, PackageCheck, ShieldCheck } from "lucide-react";

import { QuickReplyActions } from "@/components/marketplace/quick-reply-actions";
import { StatusPill } from "@/components/marketplace/status-pill";
import {
  formatBidAmount,
  formatBidTiming,
  getBidStatusLabel,
  getEntryMethodLabel,
} from "@/lib/marketplace";
import { suppliesSourceOptions } from "@/lib/marketplace-constants";

type CoordinationBid = {
  pricingType: BidPricingType;
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  estimatedHours: number | null;
  etaMinutes: number | null;
  arrivalDate: Date | null;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
  status: BidStatus;
};

type CoordinationJob = {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  entryMethod: EntryMethod;
  entryNotes: string | null;
  suppliesSource: SuppliesSource;
};

export function JobCoordinationSummary({
  bid,
  cleanerName,
  customerName,
  job,
  role,
}: {
  bid: CoordinationBid;
  cleanerName?: string;
  customerName?: string;
  job: CoordinationJob;
  role: "customer" | "cleaner";
}) {
  const isAccepted = bid.status === BidStatus.ACCEPTED;
  const address = isAccepted
    ? formatFullAddress(job)
    : `${job.city}, ${job.state} ${job.postalCode}`;
  const suppliesLabel =
    suppliesSourceOptions.find((option) => option.value === job.suppliesSource)?.label ??
    "Cleaner brings supplies";
  const replies =
    role === "customer"
      ? ["Sounds good", "Can you confirm?", "I'll be home", "Please message me before arrival"]
      : ["Confirmed", "Can you confirm access?", "I'll message before arrival", "Running a few minutes late"];

  return (
    <section className="coordination-summary" aria-labelledby="coordination-summary-title">
      <div className="coordination-summary__topline">
        <div>
          <p className="market-kicker">Job coordination</p>
          <h2 id="coordination-summary-title">
            {role === "customer" ? cleanerName : customerName}
          </h2>
        </div>
        <StatusPill
          label={getBidStatusLabel(bid.status)}
          tone={isAccepted ? "success" : "default"}
        />
      </div>

      <div className="coordination-summary__grid">
        <SummaryItem Icon={Home} label={isAccepted ? "Address" : "Area"} value={address} />
        <SummaryItem Icon={Clock3} label="Arrival" value={formatBidTiming(bid)} />
        <SummaryItem Icon={DollarSign} label="Price" value={formatBidAmount(bid)} />
        <SummaryItem
          Icon={DoorOpen}
          label="Access"
          value={isAccepted ? getEntryMethodLabel(job.entryMethod) : "Shared after acceptance"}
          detail={isAccepted ? job.entryNotes : null}
        />
        <SummaryItem Icon={PackageCheck} label="Supplies" value={suppliesLabel} />
        <SummaryItem
          Icon={ShieldCheck}
          label="Protection"
          value={isAccepted ? "Job details confirmed" : "Details unlock after acceptance"}
        />
      </div>

      <QuickReplyActions replies={replies} />
    </section>
  );
}

function SummaryItem({
  detail,
  Icon,
  label,
  value,
}: {
  detail?: string | null;
  Icon: ComponentType<{ "aria-hidden": true }>;
  label: string;
  value: string;
}) {
  return (
    <div className="coordination-summary-item">
      <Icon aria-hidden={true} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail ? <p>{detail}</p> : null}
      </div>
    </div>
  );
}

function formatFullAddress(job: CoordinationJob) {
  return [
    job.addressLine1,
    job.addressLine2,
    `${job.city}, ${job.state} ${job.postalCode}`,
  ]
    .filter(Boolean)
    .join(", ");
}
