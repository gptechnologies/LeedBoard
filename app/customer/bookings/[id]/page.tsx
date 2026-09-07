import { CalendarDays, ChevronLeft, Clock3, MapPin, ReceiptText, UserRound } from "lucide-react";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function CustomerBookingPage({ params }: { params: Params }) {
  const user = await requireUser(UserRole.CUSTOMER);
  const { id } = await params;
  const booking = await prisma.booking.findFirst({
    where: { id, customerId: user.id },
    include: { cleaner: true, service: true, slot: true },
  });

  if (!booking) notFound();

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const visitDate = booking.slot.startsAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const visitTime = `${booking.slot.startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}–${booking.slot.endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  return (
    <div className="wk-app-screen wk-secondary-app-screen">
      <AppScreenHeader accountMenu initials={initials} />
      <div className="wk-screen-content">
        <header className="wk-homeowner-detail-heading">
          <Link href="/customer/jobs"><ChevronLeft aria-hidden="true" />Back to activity</Link>
          <div><h1>Visit details</h1><p>Confirmation {booking.bookingNumber}</p></div>
        </header>

        <section className="wk-booking-summary">
          <div className="wk-booking-summary__status">
            <ReceiptText aria-hidden="true" />
            <div><small>Status</small><strong>{formatBookingStatus(booking.status)}</strong></div>
            <b>{formatCurrency(booking.totalCents)}</b>
          </div>
          <dl>
            <BookingDetail Icon={CalendarDays} label="Service" value={booking.service.name} />
            <BookingDetail Icon={Clock3} label="When" value={`${visitDate} · ${visitTime}`} />
            <BookingDetail Icon={UserRound} label="Cleaner" value={`${booking.cleaner.firstName} ${booking.cleaner.lastName}`} />
            <BookingDetail Icon={MapPin} label="Address" value={[booking.addressLine1, booking.addressLine2, `${booking.city}, ${booking.state} ${booking.postalCode}`].filter(Boolean).join(", ")} />
          </dl>
        </section>
      </div>
    </div>
  );
}

function BookingDetail({ Icon, label, value }: {
  Icon: React.ComponentType<{ "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Icon aria-hidden />
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatBookingStatus(status: string) {
  if (status === "BOOKED") return "Confirmed";
  if (status === "EN_ROUTE") return "Cleaner en route";
  if (status === "ARRIVED") return "Cleaner arrived";
  if (status === "IN_PROGRESS") return "In progress";
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  return "Payment pending";
}
