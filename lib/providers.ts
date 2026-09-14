type ProviderIdentity = {
  cleaner?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    cleanerProfile?: {
      businessName?: string | null;
      headline?: string | null;
      googleRating?: number | null;
      googleReviewCount?: number | null;
      licensedAndInsured?: boolean;
    } | null;
  } | null;
  cleanerLead?: {
    businessName?: string | null;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    googleRating?: number | null;
    googleReviewCount?: number | null;
  } | null;
};

export function getProviderName(value: ProviderIdentity) {
  return (
    value.cleanerLead?.businessName ||
    value.cleaner?.cleanerProfile?.businessName ||
    value.cleanerLead?.name ||
    (value.cleaner
      ? `${value.cleaner.firstName} ${value.cleaner.lastName}`.trim()
      : null) ||
    "Local cleaning provider"
  );
}

export function getProviderRating(value: ProviderIdentity) {
  return value.cleanerLead?.googleRating ?? value.cleaner?.cleanerProfile?.googleRating ?? null;
}

export function getProviderReviewCount(value: ProviderIdentity) {
  return (
    value.cleanerLead?.googleReviewCount ??
    value.cleaner?.cleanerProfile?.googleReviewCount ??
    null
  );
}

export function getProviderPhone(value: ProviderIdentity) {
  return value.cleanerLead?.phone ?? value.cleaner?.phone ?? null;
}

export function getProviderHeadline(value: ProviderIdentity) {
  if (value.cleanerLead) return "Local cleaning business";
  return value.cleaner?.cleanerProfile?.headline ?? "Available cleaner";
}

export function isProviderInsured(value: ProviderIdentity) {
  return value.cleaner?.cleanerProfile?.licensedAndInsured ?? false;
}

export function getJobReference(job: { id: string; publicReference?: string | null }) {
  if (job.publicReference) return job.publicReference;
  return `WK-${job.id.slice(-6).toUpperCase()}`;
}

export function getConversationReference(bid: { id: string; jobRequest: { id: string; publicReference?: string | null } }) {
  return `${getJobReference(bid.jobRequest)}-${bid.id.slice(-8).toUpperCase()}`;
}

export function resolveConversationReference<T extends { id: string; jobRequest: { id: string; publicReference?: string | null } }>(bids: T[], body: string) {
  const reference = body.match(/\bWK-[A-Z0-9]{6}(?:-[A-Z0-9]{8})?\b/i)?.[0].toUpperCase() ?? null;
  const matches = reference ? bids.filter((bid) =>
    [getConversationReference(bid), getJobReference(bid.jobRequest)].some((value) => value.toUpperCase() === reference),
  ) : bids;
  const messageBody = reference
    ? body.replace(new RegExp(`(?:Well Kept\\s+)?${reference}\\s*[:–-]?\\s*`, "i"), "").trim()
    : body.trim();
  return { matches, messageBody, reference };
}

export function createJobReference() {
  return `WK-${randomInt(100000, 1000000)}`;
}
import { randomInt } from "node:crypto";
