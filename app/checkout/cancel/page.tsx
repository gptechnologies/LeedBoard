import { ArrowLeft, CreditCard } from "lucide-react";
import { UserRole } from "@prisma/client";
import Link from "next/link";

import { markBookingPaymentFailed } from "@/lib/bookings";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

type CheckoutCancelPageProps = {
  searchParams: Promise<{ booking?: string }>;
};

export default async function CheckoutCancelPage({ searchParams }: CheckoutCancelPageProps) {
  const user = await requireUser(UserRole.CUSTOMER);
  const params = await searchParams;

  if (params.booking) {
    const booking = await prisma.booking.findFirst({
      where: { id: params.booking, customerId: user.id },
      select: { id: true },
    });
    if (booking) await markBookingPaymentFailed(booking.id);
  }

  return (
    <section className="wk-checkout-screen">
      <div className="wk-checkout-state__mark wk-checkout-state__mark--quiet" aria-hidden="true"><CreditCard /></div>
      <p className="eyebrow">Payment not completed</p>
      <h1>Your card wasn’t charged.</h1>
      <p className="wk-checkout-state__intro">
        The reservation was not finalized. You can review your activity or post another cleaning request.
      </p>
      <div className="wk-checkout-actions">
        <Link href="/customer/jobs" className="button-link wk-pressable">View activity</Link>
        <Link href="/customer/jobs/new" className="button-link secondary wk-pressable">
          <ArrowLeft aria-hidden="true" /> Post a job
        </Link>
      </div>
    </section>
  );
}
