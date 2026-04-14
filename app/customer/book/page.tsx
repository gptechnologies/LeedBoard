import { UserRole } from "@prisma/client";
import { BookingForm } from "@/components/booking-form";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

type CustomerBookPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CustomerBookPage({ searchParams }: CustomerBookPageProps) {
  await requireUser(UserRole.CUSTOMER);
  const params = await searchParams;
  const [services, addOns, cleaners, slots] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { basePriceCents: "asc" },
    }),
    prisma.addOn.findMany({
      where: { isActive: true },
      orderBy: { priceCents: "asc" },
    }),
    prisma.user.findMany({
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
      orderBy: { firstName: "asc" },
    }),
    prisma.timeSlot.findMany({
      where: {
        isActive: true,
        startsAt: {
          gt: new Date(),
        },
      },
      orderBy: { startsAt: "asc" },
      take: 20,
    }),
  ]);

  if (cleaners.length === 0) {
    return (
      <section className="empty-state stack">
        <h1>No arrival windows are available right now.</h1>
        <p className="subtle">
          Our schedule is currently full. Please check back shortly for new availability.
        </p>
      </section>
    );
  }

  return (
    <div className="stack">
      {params.error ? <div className="notice error">{params.error}</div> : null}
      <BookingForm services={services} addOns={addOns} cleaners={cleaners} slots={slots} />
    </div>
  );
}
