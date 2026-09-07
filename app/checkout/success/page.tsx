import { Check, ChevronRight, Clock3, ReceiptText } from "lucide-react";
import { UserRole } from "@prisma/client";
import Link from "next/link";

import { markBookingPaid } from "@/lib/bookings";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    booking?: string;
    session_id?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const user = await requireUser(UserRole.CUSTOMER);
  const params = await searchParams;
  const bookingId = params.booking;

  const booking = bookingId
    ? await prisma.booking.findFirst({
        where: { id: bookingId, customerId: user.id },
        include: { cleaner: true, service: true, slot: true },
      })
    : null;

  if (!booking) {
    return (
      <section className="wk-checkout-screen wk-recovery-state wk-recovery-state--public">
        <span aria-hidden="true"><ReceiptText /></span>
        <p className="eyebrow">Confirmation unavailable</p>
        <h1>We couldn’t find that payment.</h1>
        <p>Open your activity to review your current cleaning requests.</p>
        <Link className="button-link wk-pressable" href="/customer/jobs">View activity</Link>
      </section>
    );
  }

  if (isStripeConfigured() && params.session_id) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(params.session_id);

    if (session.payment_status === "paid") {
      await markBookingPaid({
        bookingId: booking.id,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      });
    }
  }

  return (
    <section className="wk-checkout-screen">
      <div className="wk-checkout-state__mark" aria-hidden="true"><Check /></div>
      <p className="eyebrow">Payment received</p>
      <h1>Your cleaning is confirmed.</h1>
      <p className="wk-checkout-state__intro">
        Your visit is reserved with {booking.cleaner.firstName} {booking.cleaner.lastName}.
      </p>

      <dl className="wk-checkout-details">
        <div><dt>Confirmation</dt><dd>{booking.bookingNumber}</dd></div>
        <div><dt>Service</dt><dd>{booking.service.name}</dd></div>
        <div><dt>Cleaner</dt><dd>{booking.cleaner.firstName} {booking.cleaner.lastName}</dd></div>
        <div><dt>Total</dt><dd>{formatCurrency(booking.totalCents)}</dd></div>
      </dl>

      <div className="wk-checkout-next">
        <Clock3 aria-hidden="true" />
        <div><strong>What happens next</strong><span>Your arrival window is reserved. Updates will appear in your activity.</span></div>
      </div>

      <Link href={`/customer/bookings/${booking.id}`} className="button-link wk-pressable">
        View visit details <ChevronRight aria-hidden="true" />
      </Link>
    </section>
  );
}
