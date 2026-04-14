import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { markBookingPaid } from "@/lib/bookings";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { formatCurrency } from "@/lib/format";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    booking?: string;
    session_id?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const bookingId = params.booking;

  if (!bookingId) {
    return (
      <section className="empty-state stack">
        <h1>Your confirmation details aren't available yet.</h1>
      </section>
    );
  }

  if (isStripeConfigured() && params.session_id) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(params.session_id);

    if (session.payment_status === "paid") {
      await markBookingPaid({
        bookingId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      });
    }
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      cleaner: true,
      service: true,
      slot: true,
    },
  });

  if (!booking) {
    return (
      <section className="empty-state stack">
        <h1>We couldn't find that confirmation.</h1>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div className="eyebrow">Confirmation received</div>
      <h1>Your cleaning is confirmed.</h1>
      <p className="subtle">
        Your visit is reserved, your payment has been received, and your booking details
        are ready whenever you need them.
      </p>
      <div className="grid two">
        <div className="card stack small">
          <strong>{booking.bookingNumber}</strong>
          <div>{booking.service.name}</div>
          <div>
            Assigned professional: {booking.cleaner.firstName} {booking.cleaner.lastName}
          </div>
          <div>{formatCurrency(booking.totalCents)}</div>
        </div>
        <div className="card stack small">
          <strong>What happens next</strong>
          <div>Your arrival window is now reserved.</div>
          <div>You'll be able to track progress and review visit details from your account.</div>
        </div>
      </div>
      <div className="actions-row">
        <Link href={`/customer/bookings/${booking.id}`} className="button-link">
          View my visit
        </Link>
        <Link href="/customer" className="button-link secondary">
          Return to my account
        </Link>
      </div>
    </section>
  );
}
