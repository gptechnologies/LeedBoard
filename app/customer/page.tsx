import Link from "next/link";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatCurrency, formatDateTimeRange } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function CustomerDashboard() {
  const user = await requireUser(UserRole.CUSTOMER);
  const bookings = await prisma.booking.findMany({
    where: { customerId: user.id },
    include: {
      cleaner: true,
      service: true,
      slot: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="stack">
      <section className="panel stack">
        <div className="actions-row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow">Your home care hub</div>
            <h1>Manage every upcoming visit in one place.</h1>
            <p className="subtle">
              Review confirmations, check visit timing, and keep your home details ready
              for each appointment.
            </p>
          </div>
          <Link href="/customer/book" className="button-link">
            Book a visit
          </Link>
        </div>
      </section>

      {bookings.length === 0 ? (
        <section className="empty-state stack">
          <h2>Your first visit starts here.</h2>
          <p className="subtle">
            Choose your service, confirm your home details, and reserve a time that fits
            your week.
          </p>
          <div>
            <Link href="/customer/book" className="button-link">
              Schedule a cleaning
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid two">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/customer/bookings/${booking.id}`} className="job-card job-card--premium stack small">
              <div className="actions-row" style={{ justifyContent: "space-between" }}>
                <strong>{booking.bookingNumber}</strong>
                <StatusBadge status={booking.status} />
              </div>
              <div>{booking.service.name}</div>
              <div className="subtle">
                Assigned professional: {booking.cleaner.firstName} {booking.cleaner.lastName}
              </div>
              <div className="subtle">
                {formatDateTimeRange(new Date(booking.slot.startsAt), new Date(booking.slot.endsAt))}
              </div>
              <div>{booking.addressLine1}</div>
              <div>{formatCurrency(booking.totalCents)}</div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
