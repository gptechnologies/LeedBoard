import { BidStatus, JobOutreachStatus, JobRequestStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { ProviderResponseForm } from "@/components/marketplace/provider-response-form";
import { formatBidAmount, formatBidTiming, formatTimingSummary } from "@/lib/marketplace";
import { isOutreachExpired } from "@/lib/outreach";
import { prisma } from "@/lib/prisma";
import { getJobReference, getProviderName } from "@/lib/providers";

export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;
type SearchParams = Promise<{ edit?: string; error?: string; submitted?: string }>;

export default async function ProviderResponsePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { token } = await params;
  const query = await searchParams;
  const outreach = await prisma.jobOutreach.findUnique({
    where: { interestToken: token },
    include: {
      bid: true,
      cleanerLead: true,
      cleanerUser: { include: { cleanerProfile: true } },
      jobRequest: {
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
          homeProfile: {
            select: {
              bathroomCount: true,
              bedroomCount: true,
              estimatedSquareFeet: true,
              hasPets: true,
            },
          },
        },
      },
    },
  });

  if (!outreach) notFound();

  const job = outreach.jobRequest;
  const reference = getJobReference(job);
  const providerName = getProviderName(outreach);
  const expired = isOutreachExpired(outreach) || job.status !== JobRequestStatus.OPEN;
  const selected = outreach.bid?.status === BidStatus.ACCEPTED;
  const submitted =
    query.edit !== "1" &&
    (query.submitted === "1" || outreach.status === JobOutreachStatus.BID_SUBMITTED);

  return (
    <div className="provider-response-shell">
      <header className="provider-response-topbar">
        <a className="provider-wordmark" href="/" aria-label="Well Kept home">Well Kept</a>
        <span>Job {reference}</span>
      </header>

      <main className="provider-response-main">
        <section className="provider-job-intro">
          <div className="provider-job-kicker">Cleaning opportunity for {providerName}</div>
          <h1>A nearby homeowner is looking for help.</h1>
          <p>Review the essentials and send your price and availability. No account is needed.</p>
        </section>

        <section className="provider-job-summary" aria-label="Job summary">
          <div className="provider-job-summary__primary">
            <span className="provider-summary-label">Location</span>
            <strong>{job.city}, {job.state} {job.postalCode}</strong>
            <small>The street address is shared only if your offer is selected.</small>
          </div>
          <div>
            <span className="provider-summary-label">Requested</span>
            <strong>{formatTimingSummary(job)}</strong>
          </div>
          <div>
            <span className="provider-summary-label">Home</span>
            <strong>{formatHomeFacts(job.homeProfile)}</strong>
          </div>
          <div>
            <span className="provider-summary-label">Cleaning</span>
            <strong>{formatCleanType(job.cleanType)}</strong>
          </div>
          {job.notes ? (
            <div className="provider-job-summary__note">
              <span className="provider-summary-label">Homeowner note</span>
              <p>{job.notes}</p>
            </div>
          ) : null}
        </section>

        {query.error ? <div className="provider-form-alert" role="alert">{query.error}</div> : null}

        {selected && outreach.bid ? (
          <section className="provider-response-state provider-response-state--success">
            <span>Offer accepted · {reference}</span>
            <h2>You're connected.</h2>
            <div className="provider-submitted-offer">
              <strong>{formatBidAmount(outreach.bid)}</strong>
              <span>{formatBidTiming(outreach.bid)}</span>
            </div>
            <div className="provider-connection-details">
              <div>
                <span className="provider-summary-label">Homeowner</span>
                <strong>{`${job.customer.firstName} ${job.customer.lastName}`.trim()}</strong>
                {job.customer.phone ? <a href={`tel:${job.customer.phone}`}>{job.customer.phone}</a> : null}
                {job.customer.email ? <a href={`mailto:${job.customer.email}`}>{job.customer.email}</a> : null}
              </div>
              <div>
                <span className="provider-summary-label">Service address</span>
                <strong>{job.addressLine1}{job.addressLine2 ? `, ${job.addressLine2}` : ""}</strong>
                <span>{job.city}, {job.state} {job.postalCode}</span>
              </div>
            </div>
            <p>Contact the homeowner directly to confirm final details. Keep {reference} handy if you contact Well Kept support.</p>
          </section>
        ) : expired ? (
          <section className="provider-response-state">
            <span>Job {reference}</span>
            <h2>This opportunity is closed.</h2>
            <p>The homeowner has selected a provider or the response window has ended.</p>
          </section>
        ) : submitted && outreach.bid ? (
          <section className="provider-response-state provider-response-state--success">
            <span>Offer submitted</span>
            <h2>You're in the running.</h2>
            <div className="provider-submitted-offer">
              <strong>{formatBidAmount(outreach.bid)}</strong>
              <span>{formatBidTiming(outreach.bid)}</span>
            </div>
            <p>We’ll let you know if the homeowner selects your offer. You can use this same link to update it while the job remains open.</p>
            <a href={`/invite/cleaner/${token}?edit=1`} className="provider-edit-link">Update offer</a>
          </section>
        ) : outreach.status === JobOutreachStatus.NOT_INTERESTED ? (
          <section className="provider-response-state">
            <span>Response saved</span>
            <h2>We'll pass on this one.</h2>
            <p>This only declines job {reference}. It does not opt you out of future opportunities.</p>
          </section>
        ) : (
          <>
            <ProviderResponseForm
              token={token}
              timingPreference={job.timingPreference}
              requestedDate={job.requestedDate?.toISOString().slice(0, 10) ?? null}
              requestedTime={job.requestedWindowStart}
            />
            <form action={`/invite/cleaner/${token}/not-interested`} method="post" className="provider-pass-form">
              <button type="submit">Not available for this job</button>
              <span>This does not unsubscribe you from future Well Kept opportunities.</span>
            </form>
          </>
        )}
      </main>

      <footer className="provider-response-footer">
        <span>Well Kept connects homeowners with local cleaning businesses.</span>
        <span>Job reference {reference}</span>
      </footer>
    </div>
  );
}

function formatHomeFacts(home: {
  bathroomCount: number | null;
  bedroomCount: number | null;
  estimatedSquareFeet: number | null;
  hasPets: boolean;
} | null) {
  if (!home) return "Details provided after selection";
  const facts = [
    home.bedroomCount === null ? null : `${home.bedroomCount} bed`,
    home.bathroomCount === null ? null : `${home.bathroomCount} bath`,
    home.estimatedSquareFeet ? `${home.estimatedSquareFeet.toLocaleString("en-US")} sq ft` : null,
    home.hasPets ? "Pets in home" : null,
  ].filter(Boolean);
  return facts.join(" · ") || "Home details available";
}

function formatCleanType(value: string | null) {
  if (!value) return "Home cleaning";
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
