import Link from "next/link";
import { BookingStatus, UserRole } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatCurrency, formatDateTimeRange } from "@/lib/format";
import { summarizeBookingPrice } from "@/lib/bookings";

type BookingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const user = await requireUser(UserRole.CUSTOMER);
  const { id } = await params;
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      customerId: user.id,
    },
    include: {
      cleaner: true,
      service: true,
      slot: true,
      addOns: {
        include: {
          addOn: true,
        },
      },
      events: {
        include: {
          actor: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) {
    return (
      <section className="empty-state stack">
        <h1>We couldn't find that visit.</h1>
        <Link href="/customer" className="button-link secondary">
          Return to my account
        </Link>
      </section>
    );
  }

  const canCancel =
    booking.status !== BookingStatus.CANCELLED &&
    booking.status !== BookingStatus.COMPLETED &&
    new Date(booking.slot.startsAt) > new Date();

  return (
    <div className="stack">
      <section className="panel stack">
        <div className="actions-row" style={{ justifyContent: "space-between" }}>
          <div className="stack small">
            <div className="eyebrow">Visit details</div>
            <h1>{booking.bookingNumber}</h1>
            <div className="subtle">
              {formatDateTimeRange(new Date(booking.slot.startsAt), new Date(booking.slot.endsAt))}
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid two">
          <div className="card stack small">
            <h2>Your assigned professional</h2>
            <div>
              {booking.cleaner.firstName} {booking.cleaner.lastName}
            </div>
            <div className="subtle">{booking.cleaner.email}</div>
          </div>
          <div className="card stack small">
            <h2>Service address</h2>
            <div>{booking.addressLine1}</div>
            {booking.addressLine2 ? <div>{booking.addressLine2}</div> : null}
            <div>
              {booking.city}, {booking.state} {booking.postalCode}
            </div>
          </div>
        </div>
      </section>

      <section className="grid two">
        <div className="panel stack">
          <h2>Visit overview</h2>
          <div>{booking.service.name}</div>
          <div className="subtle">
            {booking.bedrooms} bedrooms · {booking.bathrooms} bathrooms
          </div>
          {booking.notes ? <div>{booking.notes}</div> : null}
          <div className="stack small">
            <strong>Selected add-ons</strong>
            {booking.addOns.length === 0 ? (
              <div className="subtle">No additional services were added to this visit.</div>
            ) : (
              booking.addOns.map((item) => (
                <div key={item.id} className="price-line">
                  <span>{item.addOn.name}</span>
                  <span>{formatCurrency(item.totalPriceCents)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel stack">
          <h2>Billing summary</h2>
          <div className="price-list">
            {summarizeBookingPrice(booking).map((line) => (
              <div key={line.label} className={`price-line ${line.label === "Total" ? "total" : ""}`}>
                <span>{line.label}</span>
                <span>{formatCurrency(line.amount)}</span>
              </div>
            ))}
          </div>
          <div className="subtle">Payment: {booking.paymentStatus.toLowerCase()}</div>
        </div>
      </section>

      <section className="grid two">
        <div className="panel stack">
          <h2>Visit progress</h2>
          <div className="timeline">
            {booking.events.map((event) => (
              <div key={event.id} className="timeline-item">
                <strong>
                  {event.toStatus ? event.toStatus.replaceAll("_", " ") : event.eventType.replaceAll("_", " ")}
                </strong>
                <span className="subtle">
                  {new Date(event.createdAt).toLocaleString()}{" "}
                  {event.actor ? `· ${event.actor.firstName} ${event.actor.lastName}` : ""}
                </span>
                {event.note ? <span>{event.note}</span> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="panel stack">
          <h2>Need to make a change?</h2>
          {canCancel ? (
            <form action={`/customer/bookings/${booking.id}/cancel`} method="post">
              <button type="submit" className="secondary-submit">
                Cancel this visit
              </button>
            </form>
          ) : (
            <div className="subtle">
              This visit is already underway or complete. Please contact support for any
              changes.
            </div>
          )}
          <div className="notice">Customer Care · hello@archmontcleaners.com · (518) 555-0148</div>
        </div>
      </section>
    </div>
  );
}
