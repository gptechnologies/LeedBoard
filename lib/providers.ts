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

export function createJobReference() {
  return `WK-${randomInt(100000, 1000000)}`;
}
import { randomInt } from "node:crypto";
