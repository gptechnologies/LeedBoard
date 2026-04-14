import {
  BookingStatus,
  BookingEventType,
  PaymentStatus,
  type AddOn,
  type Booking,
  type Prisma,
  type Service,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateBookingPrice } from "@/lib/pricing";

export const customerVisibleStatuses: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  BOOKED: "Confirmed",
  EN_ROUTE: "On the way",
  ARRIVED: "Arrived",
  IN_PROGRESS: "In service",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const cleanerStatusOrder: BookingStatus[] = [
  BookingStatus.BOOKED,
  BookingStatus.EN_ROUTE,
  BookingStatus.ARRIVED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
];

export async function ensureSeedData() {
  await prisma.$transaction(async (tx) => {
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
      await tx.service.upsert({
        where: { slug: service.slug },
        update: service,
        create: service,
      });
    }

    for (const addOn of addOns) {
      await tx.addOn.upsert({
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

        await tx.timeSlot.upsert({
          where: { startsAt_endsAt: { startsAt, endsAt } },
          update: { isActive: true },
          create: { startsAt, endsAt, isActive: true },
        });
      }
    }
  });
}

export async function getBookingPricingData(input: {
  serviceId: string;
  addOnIds: string[];
  bedrooms: number;
  bathrooms: number;
}) {
  const [service, addOns] = await Promise.all([
    prisma.service.findUnique({ where: { id: input.serviceId } }),
    prisma.addOn.findMany({ where: { id: { in: input.addOnIds } } }),
  ]);

  if (!service) {
    throw new Error("Selected service was not found.");
  }

  return {
    service,
    addOns,
    pricing: calculateBookingPrice({
      service,
      addOns,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
    }),
  };
}

export async function cleanerHasConflictingBooking(cleanerId: string, slotId: string) {
  const existing = await prisma.booking.findFirst({
    where: {
      cleanerId,
      slotId,
      status: {
        not: BookingStatus.CANCELLED,
      },
      OR: [
        {
          status: {
            not: BookingStatus.PENDING_PAYMENT,
          },
        },
        {
          status: BookingStatus.PENDING_PAYMENT,
          expiresAt: {
            gt: new Date(),
          },
        },
      ],
    },
    select: { id: true },
  });

  return Boolean(existing);
}

export function canCleanerMoveToStatus(currentStatus: BookingStatus, nextStatus: BookingStatus) {
  const currentIndex = cleanerStatusOrder.indexOf(currentStatus);
  const nextIndex = cleanerStatusOrder.indexOf(nextStatus);

  return currentIndex >= 0 && nextIndex === currentIndex + 1;
}

export async function recordBookingEvent(input: {
  bookingId: string;
  actorId?: string;
  eventType: BookingEventType;
  fromStatus?: BookingStatus;
  toStatus?: BookingStatus;
  note?: string;
  tx?: Prisma.TransactionClient;
}) {
  const db = input.tx ?? prisma;

  await db.bookingEvent.create({
    data: {
      bookingId: input.bookingId,
      actorId: input.actorId,
      eventType: input.eventType,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      note: input.note,
    },
  });
}

export async function markBookingPaid(input: {
  bookingId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
  });

  if (!booking || booking.paymentStatus === PaymentStatus.PAID) {
    return booking;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: input.bookingId },
      data: {
        status: BookingStatus.BOOKED,
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
        expiresAt: null,
        stripeCheckoutSessionId:
          input.stripeCheckoutSessionId ?? booking.stripeCheckoutSessionId,
        stripePaymentIntentId:
          input.stripePaymentIntentId ?? booking.stripePaymentIntentId,
      },
    });

    await recordBookingEvent({
      bookingId: updated.id,
      eventType: BookingEventType.PAYMENT_CONFIRMED,
      fromStatus: booking.status,
      toStatus: BookingStatus.BOOKED,
      tx,
    });

    return updated;
  });
}

export async function markBookingPaymentFailed(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking || booking.paymentStatus !== "PENDING") {
    return booking;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
        cancelledAt: new Date(),
        expiresAt: null,
      },
    });

    await recordBookingEvent({
      bookingId,
      eventType: BookingEventType.PAYMENT_FAILED,
      fromStatus: booking.status,
      toStatus: BookingStatus.CANCELLED,
      tx,
      note: "Checkout did not complete.",
    });

    return updated;
  });
}

export function buildBookingNumber() {
  return `CLN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    service: true;
    cleaner: true;
    customer: true;
    slot: true;
    addOns: {
      include: {
        addOn: true;
      };
    };
    events: {
      include: {
        actor: true;
      };
    };
  };
}>;

export function summarizeBookingPrice(booking: Pick<Booking, "subtotalCents" | "addOnTotalCents" | "taxCents" | "totalCents">) {
  return [
    { label: "Service subtotal", amount: booking.subtotalCents },
    { label: "Add-ons", amount: booking.addOnTotalCents },
    { label: "Tax", amount: booking.taxCents },
    { label: "Total", amount: booking.totalCents },
  ];
}

export function summarizeQuote(input: {
  service: Service;
  addOns: AddOn[];
  bedrooms: number;
  bathrooms: number;
}) {
  const pricing = calculateBookingPrice(input);

  return {
    ...pricing,
    lineItems: [
      { label: input.service.name, amount: input.service.basePriceCents },
      { label: "Home size adjustment", amount: pricing.subtotalCents - input.service.basePriceCents },
      ...input.addOns.map((addOn) => ({
        label: addOn.name,
        amount: addOn.priceCents,
      })),
      { label: "Tax", amount: pricing.taxCents },
    ],
  };
}
