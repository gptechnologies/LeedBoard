import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  BidPricingType,
  BidStatus,
  CleanLevel,
  EntryMethod,
  JobRequestStatus,
  PrismaClient,
  RoomType,
  ServiceNeed,
  TimingPreference,
  UserRole,
} from "@prisma/client";

const connectionString = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_DATABASE_URL or DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@archmontcleaners.local" },
    update: {},
    create: {
      role: UserRole.ADMIN,
      firstName: "Archmont",
      lastName: "Admin",
      email: "admin@archmontcleaners.local",
    },
  });

  const services = [
    {
      slug: "standard-clean",
      name: "Standard Clean",
      description: "A beautifully maintained-home clean for weekly, biweekly, or one-time upkeep.",
      basePriceCents: 12000,
      durationMinutes: 180,
    },
    {
      slug: "deep-clean",
      name: "Deep Clean",
      description: "A top-to-bottom refresh for homes that need added detail and extra attention.",
      basePriceCents: 18000,
      durationMinutes: 240,
    },
    {
      slug: "move-out-clean",
      name: "Move Out Clean",
      description: "A move-ready reset designed to leave the space fresh, polished, and presentation-ready.",
      basePriceCents: 22000,
      durationMinutes: 300,
    },
  ];

  const addOns = [
    {
      slug: "inside-fridge",
      name: "Inside Fridge",
      description: "Detailed wipe-down of shelves, drawers, and interior compartments.",
      priceCents: 2500,
      durationMinutes: 20,
    },
    {
      slug: "inside-oven",
      name: "Inside Oven",
      description: "Interior scrub of the oven cavity, door, and racks.",
      priceCents: 3000,
      durationMinutes: 30,
    },
    {
      slug: "pet-hair-treatment",
      name: "Pet Hair Treatment",
      description: "Extra vacuuming and detail work for homes with heavy pet hair.",
      priceCents: 2000,
      durationMinutes: 20,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }

  for (const addOn of addOns) {
    await prisma.addOn.upsert({
      where: { slug: addOn.slug },
      update: addOn,
      create: addOn,
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 14; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    const weekday = day.getDay();

    if (weekday === 0) {
      continue;
    }

    for (const [startHour, endHour] of [
      [9, 12],
      [13, 16],
    ]) {
      const startsAt = new Date(day);
      startsAt.setHours(startHour, 0, 0, 0);
      const endsAt = new Date(day);
      endsAt.setHours(endHour, 0, 0, 0);

      await prisma.timeSlot.upsert({
        where: {
          startsAt_endsAt: {
            startsAt,
            endsAt,
          },
        },
        update: { isActive: true },
        create: {
          startsAt,
          endsAt,
          isActive: true,
        },
      });
    }
  }

  const customer = await prisma.user.upsert({
    where: { email: "customer@archmontcleaners.local" },
    update: {
      role: UserRole.CUSTOMER,
      firstName: "Anna",
      lastName: "Grace",
      phone: "(415) 555-0184",
    },
    create: {
      role: UserRole.CUSTOMER,
      firstName: "Anna",
      lastName: "Grace",
      email: "customer@archmontcleaners.local",
      phone: "(415) 555-0184",
    },
  });

  await prisma.homeProfile.deleteMany({
    where: { customerId: customer.id },
  });

  const homeProfile = await prisma.homeProfile.create({
    data: {
      customerId: customer.id,
      label: "My Home",
      addressLine1: "1200 Market St",
      addressLine2: "Unit 5B",
      city: "San Francisco",
      state: "CA",
      postalCode: "94103",
      entryMethod: EntryMethod.DOOR_CODE,
      entryNotes: "Use the call box and I will buzz you in if needed.",
      defaultRoomTypes: [RoomType.KITCHEN, RoomType.BATHROOM, RoomType.BEDROOM, RoomType.LIVING_AREA],
      defaultCleanLevel: CleanLevel.MEDIUM,
      notes: "Two-bedroom condo on the fifth floor. Elevator available.",
      isDefault: true,
    },
  });

  const cleaners = [
    {
      email: "maria@archmontcleaners.local",
      firstName: "Maria",
      lastName: "Garcia",
      phone: "(415) 555-0101",
      profile: {
        bio: "Reliable home cleaner focused on kitchens, bathrooms, and deep refreshes.",
        headline: "Detail-focused residential cleaner",
        hourlyRateFromCents: 3500,
        standardHourlyRateCents: 3500,
        standardFlatRateCents: 15000,
        standardDeepCleanFlatRateCents: 24500,
        defaultEtaMinutes: 45,
        flatRateAvailable: true,
        bidTemplatesEnabled: true,
        googleRating: 4.9,
        googleReviewCount: 112,
        googleReviewSummary: "Clients mention punctual arrivals, thorough bathrooms, and polished kitchen work.",
        externalReviewSource: "Google",
        licensedAndInsured: true,
        serviceAreaPostalCodes: ["94103", "94107", "94110"],
        serviceNeeds: [
          ServiceNeed.GENERAL_CLEANING,
          ServiceNeed.DEEP_CLEAN,
          ServiceNeed.KITCHEN,
          ServiceNeed.BATHROOMS,
          ServiceNeed.FLOORS,
        ],
      },
    },
    {
      email: "savanah@archmontcleaners.local",
      firstName: "Savanah",
      lastName: "Lee",
      phone: "(415) 555-0102",
      profile: {
        bio: "Fast, dependable home cleaning for recurring upkeep and move-out prep.",
        headline: "Quick turn and move-out specialist",
        hourlyRateFromCents: 3200,
        standardHourlyRateCents: 3200,
        standardFlatRateCents: 14000,
        standardDeepCleanFlatRateCents: 22500,
        defaultEtaMinutes: 60,
        flatRateAvailable: true,
        bidTemplatesEnabled: true,
        googleRating: 4.8,
        googleReviewCount: 87,
        googleReviewSummary: "Known for fast turnarounds and organized move-out jobs.",
        externalReviewSource: "Google",
        licensedAndInsured: true,
        serviceAreaPostalCodes: ["94103", "94105", "94107"],
        serviceNeeds: [
          ServiceNeed.GENERAL_CLEANING,
          ServiceNeed.MOVE_OUT,
          ServiceNeed.WINDOWS,
          ServiceNeed.DUSTING,
        ],
      },
    },
    {
      email: "marcus@archmontcleaners.local",
      firstName: "Marcus",
      lastName: "Mane",
      phone: "(415) 555-0103",
      profile: {
        bio: "Residential cleaner available for flexible evening and weekend jobs.",
        headline: "Flexible schedule and flat-fee quotes",
        hourlyRateFromCents: 3800,
        standardHourlyRateCents: 3800,
        standardFlatRateCents: 16500,
        standardDeepCleanFlatRateCents: 26000,
        defaultEtaMinutes: 30,
        flatRateAvailable: true,
        bidTemplatesEnabled: true,
        googleRating: 4.7,
        googleReviewCount: 64,
        googleReviewSummary: "Praised for communication and efficient same-day availability.",
        externalReviewSource: "Google",
        licensedAndInsured: false,
        serviceAreaPostalCodes: ["94110", "94112", "94114", "94103"],
        serviceNeeds: [
          ServiceNeed.GENERAL_CLEANING,
          ServiceNeed.KITCHEN,
          ServiceNeed.BATHROOMS,
          ServiceNeed.LAUNDRY,
        ],
      },
    },
  ];

  const cleanerUsers = [];

  for (const cleaner of cleaners) {
    const user = await prisma.user.upsert({
      where: { email: cleaner.email },
      update: {
        role: UserRole.CLEANER,
        firstName: cleaner.firstName,
        lastName: cleaner.lastName,
        phone: cleaner.phone,
        cleanerProfile: {
          upsert: {
            update: {
              isAvailable: true,
              ...cleaner.profile,
            },
            create: {
              isAvailable: true,
              ...cleaner.profile,
            },
          },
        },
      },
      create: {
        role: UserRole.CLEANER,
        firstName: cleaner.firstName,
        lastName: cleaner.lastName,
        email: cleaner.email,
        phone: cleaner.phone,
        cleanerProfile: {
          create: {
            isAvailable: true,
            ...cleaner.profile,
          },
        },
      },
      include: {
        cleanerProfile: true,
      },
    });

    cleanerUsers.push(user);
  }

  await prisma.jobBid.deleteMany();
  await prisma.jobRequest.deleteMany();

  const awardedJob = await prisma.jobRequest.create({
    data: {
      customerId: customer.id,
      homeProfileId: homeProfile.id,
      title: "Weekly home reset",
      addressLine1: homeProfile.addressLine1,
      addressLine2: homeProfile.addressLine2,
      city: homeProfile.city,
      state: homeProfile.state,
      postalCode: homeProfile.postalCode,
      serviceNeeds: [
        ServiceNeed.GENERAL_CLEANING,
        ServiceNeed.KITCHEN,
        ServiceNeed.BATHROOMS,
        ServiceNeed.FLOORS,
        ServiceNeed.DUSTING,
      ],
      roomTypes: [RoomType.KITCHEN, RoomType.BATHROOM, RoomType.LIVING_AREA],
      cleanLevel: CleanLevel.MEDIUM,
      entryMethod: homeProfile.entryMethod,
      entryNotes: homeProfile.entryNotes,
      timingPreference: TimingPreference.TIME_SLOT,
      requestedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      requestedWindowStart: "11:00",
      requestedWindowEnd: "14:00",
      notes: "This one has already been fulfilled successfully.",
      status: JobRequestStatus.AWARDED,
      customerCompletedJobsSnapshot: 2,
      customerMemberSinceSnapshot: customer.createdAt,
    },
  });

  const awardedBid = await prisma.jobBid.create({
    data: {
      jobRequestId: awardedJob.id,
      cleanerId: cleanerUsers[0].id,
      pricingType: BidPricingType.FLAT,
      flatRateCents: 14500,
      arrivalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      arrivalWindowStart: "11:00",
      arrivalWindowEnd: "14:00",
      message: "Happy to handle your recurring weekly reset.",
      status: BidStatus.ACCEPTED,
    },
  });

  await prisma.jobRequest.update({
    where: { id: awardedJob.id },
    data: { acceptedBidId: awardedBid.id },
  });

  const firstJob = await prisma.jobRequest.create({
    data: {
      customerId: customer.id,
      homeProfileId: homeProfile.id,
      title: "Full house deep clean",
      addressLine1: homeProfile.addressLine1,
      addressLine2: homeProfile.addressLine2,
      city: homeProfile.city,
      state: homeProfile.state,
      postalCode: homeProfile.postalCode,
      serviceNeeds: [
        ServiceNeed.GENERAL_CLEANING,
        ServiceNeed.DEEP_CLEAN,
        ServiceNeed.KITCHEN,
        ServiceNeed.BATHROOMS,
        ServiceNeed.FLOORS,
        ServiceNeed.DUSTING,
      ],
      roomTypes: [RoomType.KITCHEN, RoomType.BATHROOM, RoomType.BEDROOM, RoomType.LIVING_AREA],
      cleanLevel: CleanLevel.DEEP,
      entryMethod: homeProfile.entryMethod,
      entryNotes: homeProfile.entryNotes,
      timingPreference: TimingPreference.TIME_SLOT,
      requestedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      requestedWindowStart: "11:00",
      requestedWindowEnd: "14:00",
      notes: "Two bedroom condo. Prioritize the kitchen and both bathrooms.",
      status: JobRequestStatus.OPEN,
      customerCompletedJobsSnapshot: 3,
      customerMemberSinceSnapshot: customer.createdAt,
    },
  });

  const secondJob = await prisma.jobRequest.create({
    data: {
      customerId: customer.id,
      homeProfileId: homeProfile.id,
      title: "Kitchen and bathrooms refresh",
      addressLine1: "55 9th St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94103",
      serviceNeeds: [
        ServiceNeed.GENERAL_CLEANING,
        ServiceNeed.KITCHEN,
        ServiceNeed.BATHROOMS,
        ServiceNeed.FLOORS,
        ServiceNeed.DUSTING,
      ],
      roomTypes: [RoomType.KITCHEN, RoomType.BATHROOM],
      cleanLevel: CleanLevel.MEDIUM,
      entryMethod: EntryMethod.I_WILL_BE_HOME,
      entryNotes: "Text me when you are 10 minutes away.",
      timingPreference: TimingPreference.ASAP,
      notes: "Looking for the soonest available cleaner this week.",
      status: JobRequestStatus.OPEN,
      customerCompletedJobsSnapshot: 3,
      customerMemberSinceSnapshot: customer.createdAt,
    },
  });

  await prisma.jobBid.createMany({
    data: [
      {
        jobRequestId: firstJob.id,
        cleanerId: cleanerUsers[0].id,
        pricingType: BidPricingType.HOURLY,
        hourlyRateCents: 3500,
        arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        arrivalWindowStart: "10:00",
        arrivalWindowEnd: "12:00",
        message: "I can arrive a bit early and stay for the full deep clean.",
        status: BidStatus.SUBMITTED,
      },
      {
        jobRequestId: firstJob.id,
        cleanerId: cleanerUsers[1].id,
        pricingType: BidPricingType.FLAT,
        flatRateCents: 22000,
        arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        arrivalWindowStart: "11:00",
        arrivalWindowEnd: "14:00",
        message: "Flat quote for the whole visit with supplies included.",
        status: BidStatus.SUBMITTED,
      },
      {
        jobRequestId: firstJob.id,
        cleanerId: cleanerUsers[2].id,
        pricingType: BidPricingType.FLAT,
        flatRateCents: 21000,
        arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        arrivalWindowStart: "14:00",
        arrivalWindowEnd: "17:00",
        message: "Licensed team with eco-friendly products and full equipment.",
        status: BidStatus.SUBMITTED,
      },
      {
        jobRequestId: secondJob.id,
        cleanerId: cleanerUsers[0].id,
        pricingType: BidPricingType.FLAT,
        flatRateCents: 16000,
        etaMinutes: 45,
        message: "Available for a same-day kitchen and bath reset.",
        status: BidStatus.SUBMITTED,
      },
      {
        jobRequestId: secondJob.id,
        cleanerId: cleanerUsers[2].id,
        pricingType: BidPricingType.HOURLY,
        hourlyRateCents: 3800,
        etaMinutes: 30,
        message: "Can be there quickly and bring all supplies except specialty products.",
        status: BidStatus.SUBMITTED,
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
