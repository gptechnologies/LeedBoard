import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@archmontcleaners.local" },
    update: {},
    create: {
      role: UserRole.ADMIN,
      firstName: "Archmont",
      lastName: "Admin",
      email: "admin@archmontcleaners.local",
      passwordHash,
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
