import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function Intro({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const i = await prisma.introduction.findUnique({ where: { token } });
  if (!i) notFound();
  const j = await prisma.jobRequest.findFirst({
    where: { id: i.jobId, acceptedBidId: i.bidId, status: "AWARDED" },
    include: { customer: true, acceptedBid: true },
  });
  if (!j) notFound();
  return (
    <section className="effortless-page effortless-intro">
      <p>Well Kept · {j.publicReference}</p>
      <h1>You’re connected.</h1>
      <p>{j.customer.firstName}</p>
      <p>
        {j.addressLine1} {j.addressLine2}
        <br />
        {j.city}, {j.state} {j.postalCode}
      </p>
      <p>
        <a href={`mailto:${j.customer.email}`}>{j.customer.email}</a>
      </p>
      {j.customer.phone && (
        <p>
          <a href={`tel:${j.customer.phone}`}>{j.customer.phone}</a>
        </p>
      )}
      <p>
        ${((j.acceptedBid?.flatRateCents ?? 0) / 100).toFixed(2)} ·{" "}
        {j.acceptedBid?.arrivalDate?.toISOString().slice(0, 10)} at{" "}
        {j.acceptedBid?.arrivalWindowStart}
      </p>
      <p>
        Arrange payment directly. Contact the homeowner to coordinate access.
      </p>
    </section>
  );
}
