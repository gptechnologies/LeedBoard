import {
  BidPricingType,
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
    return "Light Clean";
  }

  if (value === CleanLevel.DEEP) {
    return "Deep Clean";
  }

  return "Medium Clean";
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
}) {
  if (bid.pricingType === BidPricingType.HOURLY) {
    return `$${((bid.hourlyRateCents ?? 0) / 100).toFixed(0)}/hr`;
  }

  return `$${((bid.flatRateCents ?? 0) / 100).toFixed(0)} flat`;
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
  pricingType: BidPricingType;
  hourlyRateCents: number | null;
  flatRateCents: number | null;
  cleaner: {
    cleanerProfile: {
      googleRating: number | null;
      googleReviewCount: number | null;
    } | null;
  };
}>(bids: T[]) {
  return [...bids].sort((a, b) => {
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

    const aEta = a.etaMinutes ?? 9999;
    const bEta = b.etaMinutes ?? 9999;
    if (aEta !== bEta) {
      return aEta - bEta;
    }

    const aPrice =
      a.pricingType === BidPricingType.HOURLY
        ? a.hourlyRateCents ?? Number.MAX_SAFE_INTEGER
        : a.flatRateCents ?? Number.MAX_SAFE_INTEGER;
    const bPrice =
      b.pricingType === BidPricingType.HOURLY
        ? b.hourlyRateCents ?? Number.MAX_SAFE_INTEGER
        : b.flatRateCents ?? Number.MAX_SAFE_INTEGER;

    return aPrice - bPrice;
  });
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
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    getDefaultHomeProfile(customerId),
  ]);

  const latestOpenJob = jobs.find((job) => job.status === JobRequestStatus.OPEN) ?? jobs[0];
  const recommendedCleaners = await getRecommendedCleaners({
    postalCode: latestOpenJob?.postalCode ?? homeProfile?.postalCode,
    city: latestOpenJob?.city ?? homeProfile?.city,
    serviceNeeds: latestOpenJob?.serviceNeeds ?? [],
    limit: 6,
  });

  return {
    jobs,
    homeProfile,
    recommendedCleaners,
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
              status: JobRequestStatus.AWARDED,
            },
            select: { id: true },
          },
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
    label: homeProfile?.label ?? "My Home",
    addressLine1: homeProfile?.addressLine1 ?? "",
    addressLine2: homeProfile?.addressLine2 ?? "",
    city: homeProfile?.city ?? "",
    state: homeProfile?.state ?? "CA",
    postalCode: homeProfile?.postalCode ?? "",
    entryMethod: homeProfile?.entryMethod ?? EntryMethod.I_WILL_BE_HOME,
    entryNotes: homeProfile?.entryNotes ?? "",
    defaultRoomTypes: homeProfile?.defaultRoomTypes ?? [],
    defaultCleanLevel: homeProfile?.defaultCleanLevel ?? CleanLevel.MEDIUM,
    notes: homeProfile?.notes ?? "",
  };
}
