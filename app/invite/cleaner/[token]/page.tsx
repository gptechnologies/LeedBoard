import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProviderResponseForm } from "@/components/marketplace/provider-response-form";
export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function Offer({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ edit?: string; error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const o = await prisma.jobOutreach.findUnique({
    where: { interestToken: token },
    select: {
      interestTokenExpiresAt: true,
      status: true,
      bid: {
        select: {
          id: true,
          flatRateCents: true,
          arrivalDate: true,
          arrivalWindowStart: true,
          message: true,
          status: true,
          providerQuestion: true,
        },
      },
      jobRequest: {
        select: {
          id: true,
          publicReference: true,
          postalCode: true,
          bedroomCount: true,
          bathroomCount: true,
          cleanType: true,
          timingPreference: true,
          requestedDate: true,
          requestedWindowStart: true,
          requestedWindowEnd: true,
          status: true,
          acceptanceDeadline: true,
          homeProfile: { select: { bedroomCount: true, bathroomCount: true } },
        },
      },
    },
  });
  if (!o) notFound();
  const j = o.jobRequest;
  const closed =
    j.status !== "OPEN" ||
    !j.acceptanceDeadline ||
    j.acceptanceDeadline <= new Date() ||
    o.interestTokenExpiresAt <= new Date();
  const submitted = o.bid && o.bid.status !== "WITHDRAWN" && query.edit !== "1";
  return (
    <div className="effortless-page">
      <header>
        <a href="/">Well Kept</a>
        <p>
          {j.publicReference} · ZIP {j.postalCode}
        </p>
        <h1>
          {o.bid?.status === "ACCEPTED"
            ? "You’re selected."
            : "A nearby home needs a clean."}
        </h1>
        <p>
          {j.bedroomCount ?? j.homeProfile?.bedroomCount ?? "—"} bed ·{" "}
          {j.bathroomCount ?? j.homeProfile?.bathroomCount ?? "—"} bath ·{" "}
          {j.cleanType?.replaceAll("_", " ").toLowerCase() ?? "Standard clean"}
        </p>
        <p>
          {j.requestedDate
            ? `${j.requestedDate.toISOString().slice(0, 10)} · ${j.requestedWindowStart}–${j.requestedWindowEnd}`
            : "First available"}{" "}
          · New York time
        </p>
        <small>
          Cleaners bring supplies. The address and contact details stay private
          until selection.
        </small>
      </header>
      {query.error && (
        <p role="alert" className="effortless-error">
          {query.error}
        </p>
      )}
      {closed ? (
        <div className="effortless-status">
          {o.bid?.status === "ACCEPTED"
            ? "Check your email for your private introduction link."
            : "This opportunity is closed. Thanks for taking a look."}
        </div>
      ) : submitted ? (
        <section className="effortless-status">
          <h2>{o.bid!.providerQuestion ? "Question sent" : "Bid sent"}</h2>
          <p>
            {o.bid!.flatRateCents
              ? `$${(o.bid!.flatRateCents / 100).toFixed(2)} · ${o.bid!.arrivalDate?.toISOString().slice(0, 10)} at ${o.bid!.arrivalWindowStart}`
              : o.bid!.providerQuestion}
          </p>
          <a className="effortless-secondary" href={`?edit=1`}>
            Edit bid
          </a>
          <form method="post" action={`/invite/cleaner/${token}/withdraw`}>
            <button className="effortless-secondary">Withdraw bid</button>
          </form>
        </section>
      ) : (
        <ProviderResponseForm
          token={token}
          timingPreference={j.timingPreference}
          requestedDate={j.requestedDate?.toISOString().slice(0, 10) ?? null}
          requestedTime={j.requestedWindowStart}
          initial={{
            price: o.bid?.flatRateCents ? o.bid.flatRateCents / 100 : null,
            date: o.bid?.arrivalDate?.toISOString().slice(0, 10),
            time: o.bid?.arrivalWindowStart,
            note: o.bid?.message,
          }}
        />
      )}
      {!closed && (
        <>
          <details>
            <summary className="effortless-secondary">Ask a question</summary>
            <form
              className="effortless-form"
              action={`/invite/cleaner/${token}/offer`}
              method="post"
            >
              <label>
                What do you need to know?
                <textarea name="question" required maxLength={500} />
              </label>
              <small>Do not include contact details.</small>
              <button className="effortless-primary">Send question</button>
            </form>
          </details>
          <form
            method="post"
            action={`/invite/cleaner/${token}/not-interested`}
          >
            <button className="effortless-secondary">Pass on this job</button>
          </form>
        </>
      )}
    </div>
  );
}
