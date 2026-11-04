export function clock(value: string | null | undefined) {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""} ${h >= 12 ? "PM" : "AM"}`;
}
export function day(value: Date | string | null | undefined) {
  return value
    ? new Date(value).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : "First available";
}
export function jobTiming(job: {
  requestedDate: Date | string | null;
  requestedWindowStart: string | null;
  requestedWindowEnd: string | null;
}) {
  if (!job.requestedDate) return "First available";
  return `${day(job.requestedDate)}${job.requestedWindowStart ? " · " + rangeStart(job.requestedWindowStart, job.requestedWindowEnd) + (job.requestedWindowEnd ? "–" + clock(job.requestedWindowEnd) : "") : ""}`;
}
export function bidTiming(bid: {
  arrivalDate: Date | string | null;
  arrivalWindowStart: string | null;
}) {
  return bid.arrivalDate
    ? `${day(bid.arrivalDate)}${bid.arrivalWindowStart ? " · " + clock(bid.arrivalWindowStart) : ""}`
    : "Availability to confirm";
}
export function money(cents: number | null) {
  return cents === null
    ? "Price to confirm"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: cents % 100 ? 2 : 0,
      }).format(cents / 100);
}
export function age(value: Date | string, compact = false, now = Date.now()) {
  const mins = Math.max(
    0,
    Math.floor((now - new Date(value).getTime()) / 60000),
  );
  if (mins < 1) return compact ? "now" : "just now";
  if (mins < 60)
    return compact ? `${mins}m` : `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)
    return compact ? `${hrs}h` : `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14)
    return compact ? `${days}d` : `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  return compact ? `${weeks}w` : `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}
export function unreadBid(bid: {
  customerViewedAt: Date | null;
  status: string;
  messages?: { sender: string }[];
}) {
  return (
    !bid.customerViewedAt &&
    (bid.status === "SUBMITTED" ||
      bid.status === "ACCEPTED" ||
      bid.messages?.[0]?.sender === "CLEANER")
  );
}
export type HomeDetails = {
  id: string | null;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  bedroomCount: number | null;
  bathroomCount: number | null;
  estimatedSquareFeet: number | null;
  hasPets: boolean;
  entryMethod: string;
  entryNotes: string | null;
  notes: string | null;
};

function rangeStart(start: string, end: string | null) {
  const a = clock(start),
    b = clock(end);
  return end && a.slice(-2) === b.slice(-2) ? a.slice(0, -3) : a;
}
