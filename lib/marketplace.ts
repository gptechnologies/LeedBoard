import {
  BidPricingType,
  BidSelectionPriority,
  BidStatus,
  CleanLevel,
  EntryMethod,
  HomeProfile,
  JobRequestStatus,
  RoomType,
  ServiceNeed,
  TimingPreference,
  UserRole,
} from "@prisma/client";
import {
  entryMethodOptions,
  roomTypeOptions,
  serviceNeedOptions,
} from "@/lib/marketplace-constants";
import { prisma } from "@/lib/prisma";

export function getServiceNeedLabel(value: ServiceNeed) {
  return serviceNeedOptions.find((option) => option.value === value)?.label ?? value;
}

export function getRoomTypeLabel(value: RoomType) {
  return roomTypeOptions.find((option) => option.value === value)?.label ?? value;
}

export function getRoomTypeIcon(value: RoomType) {
  return roomTypeOptions.find((option) => option.value === value)?.icon ?? "•";
}

export function getEntryMethodLabel(value: EntryMethod) {
  return entryMethodOptions.find((option) => option.value === value)?.label ?? value;
}

export function getCleanLevelLabel(value: CleanLevel) {
  if (value === CleanLevel.LIGHT) {
    return "Light";
  }

  if (value === CleanLevel.DEEP) {
    return "Deep";
  }

  return "Standard";
}

export function formatServiceNeeds(needs: ServiceNeed[]) {
  return needs.map(getServiceNeedLabel).join(", ");
}

export function formatRoomTypes(roomTypes: RoomType[]) {
  return roomTypes.map(getRoomTypeLabel).join(", ");
}

export function formatTimingSummary(job: {
  timingPreference: TimingPreference;
  requestedDate: Date | null;
  requestedWindowStart: string | null;
  requestedWindowEnd: string | null;
}) {
  if (job.timingPreference === TimingPreference.ASAP) {
    return "ASAP";
  }

  if (!job.requestedDate || !job.requestedWindowStart || !job.requestedWindowEnd) {
    return "Time requested";
  }

  return `${job.requestedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} · ${formatClock(job.requestedWindowStart)} - ${formatClock(job.requestedWindowEnd)}`;
}

export function formatClock(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBidAmount(bid: {
  pricingType: BidPricingType;
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  estimatedHours?: number | null;
}) {
  if (bid.pricingType === BidPricingType.HOURLY) {
    const rate = `$${((bid.hourlyRateCents ?? 0) / 100).toFixed(0)}/hr`;
    const estimatedTotalCents = getBidEstimatedTotalCents(bid);
    return estimatedTotalCents
      ? `${rate} · est. ${formatWholeCurrency(estimatedTotalCents)}`
      : rate;
  }

  return `$${((bid.flatRateCents ?? 0) / 100).toFixed(0)} flat`;
}

export function formatEstimatedHours(hours?: number | null) {
  if (!hours) return "Hours not estimated";
  return `${hours.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1,
  })} ${hours === 1 ? "hour" : "hours"} estimated`;
}

function formatWholeCurrency(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export function getBidEstimatedTotalCents(bid: {
  pricingType: BidPricingType;
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  estimatedHours?: number | null;
}) {
  if (bid.pricingType === BidPricingType.FLAT) {
    return bid.flatRateCents;
  }

  if (!bid.hourlyRateCents || !bid.estimatedHours) {
    return null;
  }

  return Math.round(bid.hourlyRateCents * bid.estimatedHours);
}

export function formatBidTiming(bid: {
  etaMinutes: number | null;
  arrivalDate: Date | null;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
}) {
  if (bid.etaMinutes) {
    return `Can arrive in ${bid.etaMinutes} min`;
  }

  if (!bid.arrivalDate || !bid.arrivalWindowStart || !bid.arrivalWindowEnd) {
    return "Timing shared in message";
  }

  return `${bid.arrivalDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} · ${formatClock(bid.arrivalWindowStart)} - ${formatClock(bid.arrivalWindowEnd)}`;
}

export function getJobRequestStatusLabel(status: JobRequestStatus) {
  switch (status) {
    case JobRequestStatus.AWARDED:
      return "Bid accepted";
    case JobRequestStatus.COMPLETED:
      return "Completed";
    case JobRequestStatus.CANCELLED:
      return "Cancelled";
    case JobRequestStatus.EXPIRED:
      return "Expired";
    default:
      return "Accepting Bids";
  }
}

export function getBidStatusLabel(status: BidStatus) {
  switch (status) {
    case BidStatus.ACCEPTED:
      return "Accepted";
    case BidStatus.DECLINED:
      return "Declined";
    case BidStatus.WITHDRAWN:
      return "Withdrawn";
    default:
      return "Submitted";
  }
}

export function getCustomerHistorySummary(input: {
  customerCreatedAt: Date;
  completedJobs: number;
}) {
  if (input.completedJobs > 0) {
    return `${input.completedJobs} previous jobs completed`;
  }

  return `Member since ${input.customerCreatedAt.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

export function rankVisibleBids<T extends {
  etaMinutes: number | null;
  arrivalDate?: Date | null;
  arrivalWindowStart?: string | null;
  pricingType: BidPricingType;
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  estimatedHours?: number | null;
  cleaner: {
    cleanerProfile: {
      googleRating: number | null;
      googleReviewCount: number | null;
    } | null;
  };
}>(bids: T[], priority: BidSelectionPriority = BidSelectionPriority.BEST_OVERALL) {
  return [...bids].sort((a, b) => {
    if (priority === BidSelectionPriority.CHEAPEST) {
      return compareByPrice(a, b) || compareByQuality(a, b) || compareByTiming(a, b);
    }

    if (priority === BidSelectionPriority.FASTEST) {
      return compareByTiming(a, b) || compareByPrice(a, b) || compareByQuality(a, b);
    }

    if (priority === BidSelectionPriority.BEST_QUALITY) {
      return compareByQuality(a, b) || compareByPrice(a, b) || compareByTiming(a, b);
    }

    return compareByQuality(a, b) || compareByTiming(a, b) || compareByPrice(a, b);
  });
}

function compareByQuality<T extends {
  cleaner: {
    cleanerProfile: {
      googleRating: number | null;
      googleReviewCount: number | null;
    } | null;
  };
}>(a: T, b: T) {
  const aRating = a.cleaner.cleanerProfile?.googleRating ?? 0;
  const bRating = b.cleaner.cleanerProfile?.googleRating ?? 0;
  if (bRating !== aRating) {
    return bRating - aRating;
  }

  const aReviews = a.cleaner.cleanerProfile?.googleReviewCount ?? 0;
  const bReviews = b.cleaner.cleanerProfile?.googleReviewCount ?? 0;
  if (bReviews !== aReviews) {
    return bReviews - aReviews;
  }

  return 0;
}

function compareByTiming<T extends {
  etaMinutes: number | null;
  arrivalDate?: Date | null;
  arrivalWindowStart?: string | null;
}>(a: T, b: T) {
  return getTimingRank(a) - getTimingRank(b);
}

function getTimingRank(bid: {
  etaMinutes: number | null;
  arrivalDate?: Date | null;
  arrivalWindowStart?: string | null;
}) {
  if (bid.etaMinutes) {
    return bid.etaMinutes;
  }

  if (!bid.arrivalDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [hours = 23, minutes = 59] = (bid.arrivalWindowStart ?? "23:59")
    .split(":")
    .map(Number);
  const arrival = new Date(bid.arrivalDate);
  arrival.setHours(hours, minutes, 0, 0);
  return arrival.getTime() / 60000;
}

function compareByPrice<T extends {
  pricingType: BidPricingType;
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  estimatedHours?: number | null;
}>(a: T, b: T) {
  return getPriceRank(a) - getPriceRank(b);
}

function getPriceRank(bid: {
  pricingType: BidPricingType;
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  estimatedHours?: number | null;
}) {
  return getBidEstimatedTotalCents(bid) ?? Number.MAX_SAFE_INTEGER;
}

export function getBidSelectionPriorityLabel(priority: BidSelectionPriority) {
  switch (priority) {
    case BidSelectionPriority.CHEAPEST:
      return "Cheapest";
    case BidSelectionPriority.FASTEST:
      return "Fastest";
    case BidSelectionPriority.BEST_QUALITY:
      return "Best quality";
    default:
      return "Best overall";
  }
}

export function getPrimaryBidHighlight(priority: BidSelectionPriority) {
  switch (priority) {
    case BidSelectionPriority.CHEAPEST:
      return "Best value";
    case BidSelectionPriority.FASTEST:
      return "Fastest available";
    case BidSelectionPriority.BEST_QUALITY:
      return "Best quality";
    default:
      return "Best overall";
  }
}

export async function getRecommendedCleaners(input: {
  postalCode?: string | null;
  city?: string | null;
  serviceNeeds?: ServiceNeed[];
  limit?: number;
}) {
  const cleaners = await prisma.user.findMany({
    where: {
      role: UserRole.CLEANER,
      cleanerProfile: {
        is: {
          isAvailable: true,
        },
      },
    },
    include: {
      cleanerProfile: true,
    },
    orderBy: [{ firstName: "asc" }],
    take: 24,
  });

  const serviceNeeds = input.serviceNeeds ?? [];

  return cleaners
    .map((cleaner) => {
      const profile = cleaner.cleanerProfile;
      const zipScore =
        input.postalCode && profile?.serviceAreaPostalCodes.includes(input.postalCode)
          ? 2
          : 0;
      const serviceScore = profile
        ? serviceNeeds.filter((need) => profile.serviceNeeds.includes(need)).length
        : 0;
      const ratingScore = profile?.googleRating ?? 0;
      const reviewScore = profile?.googleReviewCount ?? 0;
      const rate = profile?.hourlyRateFromCents ?? Number.MAX_SAFE_INTEGER;

      return {
        ...cleaner,
        recommendationScore: zipScore + serviceScore + ratingScore + reviewScore / 100,
        rate,
      };
    })
    .sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }

      if (a.rate !== b.rate) {
        return a.rate - b.rate;
      }

      return a.firstName.localeCompare(b.firstName);
    })
    .slice(0, input.limit ?? 6);
}

export async function getDefaultHomeProfile(customerId: string) {
  return prisma.homeProfile.findFirst({
    where: {
      customerId,
      isDefault: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCustomerHomeProfiles(customerId: string) {
  return prisma.homeProfile.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getCustomerHomeData(customerId: string) {
  const [jobs, homeProfile] = await Promise.all([
    prisma.jobRequest.findMany({
      where: { customerId },
      include: {
        bids: {
          where: { status: BidStatus.SUBMITTED },
          include: {
            cleaner: {
              include: {
                cleanerProfile: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        acceptedBid: {
          include: {
            cleaner: {
              include: {
                cleanerProfile: true,
              },
            },
          },
        },
        homeProfile: {
          select: {
            bedroomCount: true,
            bathroomCount: true,
            estimatedSquareFeet: true,
            storyCount: true,
            hasPets: true,
            propertyType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    getDefaultHomeProfile(customerId),
  ]);

  return {
    jobs,
    homeProfile,
  };
}

export async function getCleanerHomeData(cleanerId: string) {
  const cleaner = await prisma.user.findUnique({
    where: { id: cleanerId },
    include: {
      cleanerProfile: true,
    },
  });

  if (!cleaner?.cleanerProfile) {
    return {
      cleaner: null,
      openJobs: [],
      bids: [],
    };
  }

  const profile = cleaner.cleanerProfile;

  const openJobs = await prisma.jobRequest.findMany({
    where: {
      status: JobRequestStatus.OPEN,
      bids: {
        none: {
          cleanerId,
        },
      },
      OR: [
        { postalCode: { in: profile.serviceAreaPostalCodes } },
        { bids: { none: {} } },
      ],
    },
    include: {
      customer: {
        include: {
          customerJobRequests: {
            where: {
              status: JobRequestStatus.COMPLETED,
            },
            select: { id: true },
          },
        },
      },
      homeProfile: {
        select: {
          bedroomCount: true,
          bathroomCount: true,
          estimatedSquareFeet: true,
          storyCount: true,
          hasPets: true,
          propertyType: true,
        },
      },
      bids: {
        where: { status: BidStatus.SUBMITTED },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const matchingOpenJobs = openJobs.filter((job) => {
    const zipMatch =
      profile.serviceAreaPostalCodes.length === 0 ||
      profile.serviceAreaPostalCodes.includes(job.postalCode);
    const serviceMatch =
      profile.serviceNeeds.length === 0 ||
      job.serviceNeeds.some((need) => profile.serviceNeeds.includes(need));

    return zipMatch && serviceMatch;
  });

  const bids = await prisma.jobBid.findMany({
    where: { cleanerId },
    include: {
      cleaner: {
        include: {
          cleanerProfile: true,
        },
      },
      jobRequest: {
        include: {
          customer: true,
          homeProfile: {
            select: {
              bedroomCount: true,
              bathroomCount: true,
              estimatedSquareFeet: true,
              storyCount: true,
              hasPets: true,
              propertyType: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return {
    cleaner,
    openJobs: matchingOpenJobs,
    bids,
  };
}

export function buildHomeProfileFormDefaults(homeProfile: HomeProfile | null) {
  return {
    label: homeProfile?.label ?? "",
    addressLine1: homeProfile?.addressLine1 ?? "",
    addressLine2: homeProfile?.addressLine2 ?? "",
    city: homeProfile?.city ?? "",
    state: homeProfile?.state ?? "CA",
    postalCode: homeProfile?.postalCode ?? "",
    bedroomCount: homeProfile?.bedroomCount ?? null,
    bathroomCount: homeProfile?.bathroomCount ?? null,
    estimatedSquareFeet: homeProfile?.estimatedSquareFeet ?? null,
    storyCount: homeProfile?.storyCount ?? null,
    hasPets: homeProfile?.hasPets ?? false,
    entryMethod: homeProfile?.entryMethod ?? EntryMethod.I_WILL_BE_HOME,
    entryNotes: homeProfile?.entryNotes ?? "",
    defaultRoomTypes: homeProfile?.defaultRoomTypes ?? [],
    defaultCleanLevel: homeProfile?.defaultCleanLevel ?? CleanLevel.MEDIUM,
    roomCleanLevels: homeProfile?.roomCleanLevels ?? {},
    notes: homeProfile?.notes ?? "",
  };
}
