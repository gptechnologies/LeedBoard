import type { PropertyType } from "@prisma/client";

export function getCleaningJobTitle(job?: {
  title?: string | null;
  homeProfile?: {
    propertyType?: PropertyType | null;
  } | null;
}) {
  if (job?.homeProfile?.propertyType === "APARTMENT") {
    return "Apartment Cleaning";
  }

  if (job?.homeProfile?.propertyType === "HOUSE") {
    return "Home Cleaning";
  }

  const title = job?.title?.trim();
  if (!title) return "Home Cleaning";

  const legacyTitle = /cleaning request|kitchen and bathroom refresh|standard kitchen request/i;
  if (legacyTitle.test(title)) return "Home Cleaning";

  return title;
}
