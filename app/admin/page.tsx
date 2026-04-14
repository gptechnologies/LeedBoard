import { BookingStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireUser(UserRole.ADMIN);
  const [bookings, cleaners] = await Promise.all([
    prisma.booking.findMany({
      include: {
        customer: true,
        cleaner: true,
        service: true,
        slot: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.user.findMany({
      where: { role: UserRole.CLEANER },
      include: {
        cleanerProfile: true,
      },
      orderBy: { firstName: "asc" },
    }),
  ]);

  const activeJobStatuses: BookingStatus[] = [
    BookingStatus.EN_ROUTE,
    BookingStatus.ARRIVED,
    BookingStatus.IN_PROGRESS,
  ];

  const inProgressCount = bookings.filter((booking) =>
    activeJobStatuses.includes(booking.status),
  ).length;

  return (
    <div className="stack">
      <section className="grid three">
        <div className="panel stack small">
          <strong>Total bookings</strong>
          <span>{bookings.length}</span>
        </div>
        <div className="panel stack small">
          <strong>Active cleaners</strong>
          <span>{cleaners.filter((cleaner) => cleaner.cleanerProfile?.isAvailable).length}</span>
        </div>
        <div className="panel stack small">
          <strong>Jobs in progress</strong>
          <span>{inProgressCount}</span>
        </div>
      </section>

      <section className="panel stack">
        <div className="eyebrow">Operations overview</div>
        <h1>Keep scheduling and fulfillment aligned.</h1>
        <p className="subtle">
          Review recent bookings, provider coverage, and active service windows from a
          single operations view.
        </p>
      </section>

      <section className="panel stack">
        <h2>Recent bookings</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Customer</th>
              <th>Cleaner</th>
              <th>Service</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.bookingNumber}</td>
                <td>
                  {booking.customer.firstName} {booking.customer.lastName}
                </td>
                <td>
                  {booking.cleaner.firstName} {booking.cleaner.lastName}
                </td>
                <td>{booking.service.name}</td>
                <td>
                  <StatusBadge status={booking.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
