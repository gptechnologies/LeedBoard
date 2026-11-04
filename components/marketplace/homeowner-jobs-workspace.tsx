"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProviderSelectionDrawer } from "./provider-selection-drawer";
export type HomeownerWorkspaceJob = {
  id: string;
  publicReference: string | null;
  postalCode: string;
  bedroomCount: number | null;
  bathroomCount: number | null;
  cleanersNotifiedCount: number;
  acceptanceDeadline: Date | null;
  status: string;
  createdAt: Date;
  requestedDate: Date | null;
  requestedWindowStart: string | null;
  requestedWindowEnd: string | null;
  bids: WorkspaceBid[];
  acceptedBid: WorkspaceBid | null;
  mailState?: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  title: string;
  notes: string | null;
  selectionPriority: string;
  timingPreference: string;
};
type WorkspaceBid = {
  id: string;
  flatRateCents: number | null;
  pricingType: string;
  hourlyRateCents: number | null;
  offerType: string | null;
  arrivalDate: Date | null;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
  requestedScheduleAccepted: boolean | null;
  message: string | null;
  providerQuestion: string | null;
  updatedAt: Date;
  cleaner: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    cleanerProfile: {
      businessName: string | null;
      googleRating: number | null;
      googleReviewCount: number | null;
    } | null;
  } | null;
  cleanerLead: {
    businessName: string | null;
    name: string | null;
    email?: string | null;
    phone: string | null;
    googleRating: number | null;
    googleReviewCount: number | null;
  } | null;
};
function name(b: WorkspaceBid) {
  return (
    b.cleanerLead?.businessName ||
    b.cleanerLead?.name ||
    b.cleaner?.cleanerProfile?.businessName ||
    [b.cleaner?.firstName, b.cleaner?.lastName].filter(Boolean).join(" ") ||
    "Local cleaner"
  );
}
function when(b: WorkspaceBid) {
  return b.arrivalDate
    ? `${new Date(b.arrivalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} · ${clock(b.arrivalWindowStart)}`
    : "Time to confirm";
}
function clock(value: string | null) {
  if (!value) return "Time to confirm";
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function total(b: WorkspaceBid) {
  return b.flatRateCents
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(b.flatRateCents / 100)
    : b.hourlyRateCents
      ? `$${b.hourlyRateCents / 100}/hr`
      : "Needs a total price";
}
export function HomeownerJobsWorkspace({
  jobs,
}: {
  jobs: HomeownerWorkspaceJob[];
}) {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const t = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);
  return (
    <div className="effortless-page">
      <header className="effortless-actions">
        <h1>My jobs</h1>
        <Link className="effortless-primary" href="/customer/jobs/new">
          Find cleaners
        </Link>
      </header>
      {!jobs.length ? (
        <section className="effortless-status">
          <h2>A cleaner home starts here.</h2>
          <p>Post your ZIP, home size, and timing. We’ll collect the prices.</p>
        </section>
      ) : (
        jobs.map((j) => <Job key={j.id} job={j} />)
      )}
    </div>
  );
}
function Job({ job: j }: { job: HomeownerWorkspaceJob }) {
  const [sort, setSort] = useState("fit");
  const offers = j.bids
    .filter((b) => !b.providerQuestion)
    .sort((a, b) =>
      sort === "price"
        ? (a.flatRateCents ?? Infinity) - (b.flatRateCents ?? Infinity)
        : sort === "soon"
          ? stamp(a) - stamp(b)
          : Number(!!b.requestedScheduleAccepted) -
              Number(!!a.requestedScheduleAccepted) ||
            stamp(a) - stamp(b) ||
            (a.flatRateCents ?? Infinity) - (b.flatRateCents ?? Infinity),
    );
  const questions = j.bids.filter((b) => b.providerQuestion);
  return (
    <article className="effortless-job" id={"job-" + j.id}>
      <small>
        {j.publicReference} · ZIP {j.postalCode}
      </small>
      <h2>
        {j.bedroomCount ?? "—"} bed · {j.bathroomCount ?? "—"} bath
      </h2>
      <p>
        {j.requestedDate
          ? `${new Date(j.requestedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} · ${j.requestedWindowStart}–${j.requestedWindowEnd}`
          : "First available"}
      </p>
      {j.status === "AWARDED" && j.acceptedBid ? (
        <section className="effortless-status">
          <h3>You’re connected with {name(j.acceptedBid)}</h3>
          <p>
            {total(j.acceptedBid)} · {when(j.acceptedBid)}
          </p>
          <p>
            <a
              href={`mailto:${j.acceptedBid.cleanerLead?.email ?? j.acceptedBid.cleaner?.email ?? ""}`}
            >
              {j.acceptedBid.cleanerLead?.email ?? j.acceptedBid.cleaner?.email}
            </a>
          </p>
          {(j.acceptedBid.cleanerLead?.phone ??
            j.acceptedBid.cleaner?.phone) && (
            <p>
              <a
                href={`tel:${j.acceptedBid.cleanerLead?.phone ?? j.acceptedBid.cleaner?.phone}`}
              >
                Call cleaner
              </a>
            </p>
          )}
          <p>
            Payment is arranged directly. Your introduction is also in your
            email.
          </p>
          <Link href={`/customer/messages/${j.acceptedBid.id}`}>
            Open conversation
          </Link>
        </section>
      ) : j.status === "OPEN" ? (
        <>
          <div className="effortless-status" role="status">
            <strong>
              {offers.length
                ? `${offers.length} ${offers.length === 1 ? "bid" : "bids"} to review`
                : j.cleanersNotifiedCount
                  ? "Waiting for prices and availability"
                  : "Your request is posted"}
            </strong>
            <p>
              {offers.length
                ? "Compare the prices and proposed times below. Your personal details stay private until you confirm."
                : j.cleanersNotifiedCount
                  ? `${j.cleanersNotifiedCount} local ${j.cleanersNotifiedCount === 1 ? "cleaner contacted" : "cleaners contacted"}. Your information stays private until you choose.`
                  : j.mailState === "NO_MATCH"
                    ? "We haven’t found a subscribed cleaner for this ZIP yet. Your request is visible to our team."
                    : j.mailState === "FAILED"
                      ? "Your request is saved. Email delivery needs attention; our team can review it."
                      : "We’re finding cleaners for your ZIP."}
            </p>
            <small>
              Closes{" "}
              {j.acceptanceDeadline
                ? new Date(j.acceptanceDeadline).toLocaleDateString()
                : ""}
            </small>
          </div>
          {offers.length > 1 && (
            <label>
              Sort bids{" "}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="fit">Schedule fit</option>
                <option value="price">Lowest total</option>
                <option value="soon">Soonest</option>
              </select>
            </label>
          )}
          {offers.map((b) => (
            <details key={b.id} className="effortless-offer">
              <summary>
                <span>
                  {name(b)}
                  <br />
                  <small>
                    {b.requestedScheduleAccepted
                      ? "Fits your schedule"
                      : "Next available"}{" "}
                    · {when(b)}
                  </small>
                </span>
                <span style={{ textAlign: "right" }}>
                  <strong>{total(b)}</strong>
                  <br />
                  <small>Review bid ›</small>
                </span>
              </summary>
              {b.message && <p>{b.message}</p>}
              <div className="effortless-actions">
                <Link href={`/customer/messages/${b.id}`}>Ask a question</Link>
                {b.flatRateCents &&
                (!b.offerType || b.offerType === "FIXED_PRICE") ? (
                  <ProviderSelectionDrawer
                    bidId={b.id}
                    jobId={j.id}
                    jobTitle={j.title}
                    price={total(b)}
                    providerName={name(b)}
                    timing={when(b)}
                    bidVersion={new Date(b.updatedAt).toISOString()}
                  />
                ) : (
                  <p>Ask the cleaner to confirm a total before selecting.</p>
                )}
              </div>
            </details>
          ))}
          {questions.length > 0 && (
            <section>
              <h3>Questions from cleaners</h3>
              {questions.map((b) => (
                <div className="effortless-offer" key={b.id}>
                  <strong>{name(b)}</strong>
                  <p>{b.providerQuestion}</p>
                  <Link href={`/customer/messages/${b.id}`}>
                    Answer privately through Well Kept
                  </Link>
                </div>
              ))}
            </section>
          )}
          <form action={`/customer/jobs/${j.id}/cancel`} method="post">
            <button className="effortless-secondary">Cancel request</button>
          </form>
        </>
      ) : (
        <div className="effortless-status">
          <p>This request has ended.</p>
          <Link href={`/customer/jobs/new?repost=${j.id}`}>
            Post again with a new time
          </Link>
        </div>
      )}
    </article>
  );
}
function stamp(b: WorkspaceBid) {
  return b.arrivalDate
    ? new Date(
        `${new Date(b.arrivalDate).toISOString().slice(0, 10)}T${b.arrivalWindowStart ?? "23:59"}:00Z`,
      ).getTime()
    : Infinity;
}
