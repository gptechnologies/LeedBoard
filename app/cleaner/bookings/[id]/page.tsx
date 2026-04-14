import Link from "next/link";
import { BookingStatus, UserRole } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatCurrency, formatDateTimeRange } from "@/lib/format";

type CleanerBookingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const nextStatusMap: Partial<Record<BookingStatus, BookingStatus>> = {
  BOOKED: BookingStatus.EN_ROUTE,
  EN_ROUTE: BookingStatus.ARRIVED,
  ARRIVED: BookingStatus.IN_PROGRESS,
  IN_PROGRESS: BookingStatus.COMPLETED,
};

const nextStatusLabel: Partial<Record<BookingStatus, string>> = {
  BOOKED: "Mark en route",
  EN_ROUTE: "Mark arrived",
  ARRIVED: "Start cleaning",
  IN_PROGRESS: "Mark completed",
};

export const dynamic = "force-dynamic";

export default async function CleanerBookingDetailPage({
  params,
}: CleanerBookingDetailPageProps) {
  const user = await requireUser(UserRole.CLEANER);
  const { id } = await params;
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      cleanerId: user.id,
    },
    include: {
      customer: true,
      service: true,
      slot: true,
      addOns: {
        include: {
          addOn: true,
        },
      },
    },
  });

  if (!booking) {
    return (
      <section className="empty-state stack">
        <h1>We couldn't find that visit.</h1>
        <Link href="/cleaner" className="button-link secondary">
          Return to schedule
        </Link>
      </section>
    );
  }

  const nextStatus = nextStatusMap[booking.status];

  return (
    <div className="stack">
      <section className="panel stack">
        <div className="actions-row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow">Assigned visit</div>
            <h1>{booking.service.name}</h1>
            <div className="subtle">
              {formatDateTimeRange(new Date(booking.slot.startsAt), new Date(booking.slot.endsAt))}
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>
      </section>

      <section className="grid two">
        <div className="panel stack">
          <h2>Visit details</h2>
          <div>
            <strong>Client</strong>
            <div>{booking.customer.firstName} {booking.customer.lastName}</div>
            <div className="subtle">{booking.customer.email}</div>
          </div>
          <div>
            <strong>Address</strong>
            <div>{booking.addressLine1}</div>
            {booking.addressLine2 ? <div>{booking.addressLine2}</div> : null}
            <div>
              {booking.city}, {booking.state} {booking.postalCode}
            </div>
          </div>
          <div>
            <strong>Home details</strong>
            <div>{booking.bedrooms} bedrooms · {booking.bathrooms} bathrooms</div>
          </div>
          <div>
            <strong>Access and visit notes</strong>
            <div>{booking.notes || "No special instructions were added for this visit."}</div>
          </div>
          <div className="stack small">
            <strong>Add-ons</strong>
            {booking.addOns.length === 0 ? (
              <div className="subtle">No add-ons selected.</div>
            ) : (
              booking.addOns.map((item) => (
                <div key={item.id} className="price-line">
                  <span>{item.addOn.name}</span>
                  <span>{formatCurrency(item.totalPriceCents)}</span>
                </div>
              ))
            )}
          </div>
          <div className="notice">Provider Support · hello@archmontcleaners.com · (518) 555-0148</div>
        </div>

        <div className="panel stack">
          <h2>Next action</h2>
          {nextStatus ? (
            <form action={`/cleaner/bookings/${booking.id}/status`} method="post">
              <input type="hidden" name="status" value={nextStatus} />
              <button type="submit">{nextStatusLabel[booking.status]}</button>
            </form>
          ) : (
            <div className="status-badge success">
              <span className="status-dot" />
              Visit complete
            </div>
          )}
          <a
            href={`https://maps.apple.com/?q=${encodeURIComponent(
              `${booking.addressLine1}, ${booking.city}, ${booking.state} ${booking.postalCode}`,
            )}`}
            className="button-link secondary"
            target="_blank"
            rel="noreferrer"
          >
            Open directions
          </a>
        </div>
      </section>
    </div>
  );
}
