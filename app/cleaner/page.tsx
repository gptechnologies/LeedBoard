import Link from "next/link";
import { BookingStatus, PaymentStatus, UserRole } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDateTimeRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CleanerDashboard() {
  const user = await requireUser(UserRole.CLEANER);
  const bookings = await prisma.booking.findMany({
    where: {
      cleanerId: user.id,
      status: {
        not: BookingStatus.CANCELLED,
      },
      paymentStatus: PaymentStatus.PAID,
    },
    include: {
      customer: true,
      service: true,
      slot: true,
    },
    orderBy: { slot: { startsAt: "asc" } },
  });

  return (
    <div className="stack">
      <section className="panel stack">
        <div className="actions-row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow">Today's schedule</div>
            <h1>Stay ahead of every assigned visit.</h1>
            <p className="subtle">
              Review your next arrival window, confirm your availability, and move each
              home through the visit stages with confidence.
            </p>
          </div>
          <form action="/cleaner/availability" method="post" className="inline-list">
            <input
              type="hidden"
              name="isAvailable"
              value={user.cleanerProfile?.isAvailable ? "false" : "true"}
            />
            <button type="submit" className="secondary-submit">
              {user.cleanerProfile?.isAvailable ? "Pause availability" : "Accept visits"}
            </button>
          </form>
        </div>
        <div className="status-badge">
          {user.cleanerProfile?.isAvailable ? "Accepting new visits" : "Unavailable for new visits"}
        </div>
      </section>

      {bookings.length === 0 ? (
        <section className="empty-state stack">
          <h2>No visits are assigned yet.</h2>
          <p className="subtle">
            As soon as a confirmed booking is assigned to you, it will appear here with
            timing, home details, and next steps.
          </p>
        </section>
      ) : (
        <section className="grid two">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/cleaner/bookings/${booking.id}`} className="job-card job-card--premium stack small">
              <div className="actions-row" style={{ justifyContent: "space-between" }}>
                <strong>{booking.customer.firstName} {booking.customer.lastName}</strong>
                <StatusBadge status={booking.status} />
              </div>
              <div>{booking.service.name}</div>
              <div className="subtle">
                {formatDateTimeRange(new Date(booking.slot.startsAt), new Date(booking.slot.endsAt))}
              </div>
              <div>{booking.addressLine1}</div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
