import type { PropertyType } from "@prisma/client";

export function getCleaningJobTitle(job?: {
  title?: string | null;
  homeProfile?: {
    propertyType?: PropertyType | null;
  } | null;
}) {
  const title = job?.title?.trim();
  const legacyTitle = /cleaning request|kitchen and bathroom refresh|standard kitchen request/i;
  const isSpecificNonCleaningTitle =
    Boolean(title) &&
    !legacyTitle.test(title!) &&
    !/^home cleaning$|^apartment cleaning$/i.test(title!);

  if (isSpecificNonCleaningTitle) {
    return title!;
  }

  if (job?.homeProfile?.propertyType === "APARTMENT") {
    return "Apartment Cleaning";
  }

  if (job?.homeProfile?.propertyType === "HOUSE") {
    return "Home Cleaning";
  }

  if (!title) return "Home Cleaning";

  if (legacyTitle.test(title)) return "Home Cleaning";

  return title;
}
