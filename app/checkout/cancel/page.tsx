import Link from "next/link";
import { markBookingPaymentFailed } from "@/lib/bookings";

type CheckoutCancelPageProps = {
  searchParams: Promise<{
    booking?: string;
  }>;
};

export default async function CheckoutCancelPage({ searchParams }: CheckoutCancelPageProps) {
  const params = await searchParams;

  if (params.booking) {
    await markBookingPaymentFailed(params.booking);
  }

  return (
    <section className="panel stack">
      <div className="eyebrow">Payment not completed</div>
      <h1>Your reservation wasn't finalized.</h1>
      <p className="subtle">
        Your card was not charged, and the visit was not confirmed. You can return to
        booking whenever you're ready.
      </p>
      <Link href="/customer/book" className="button-link">
        Return to booking
      </Link>
    </section>
  );
}
