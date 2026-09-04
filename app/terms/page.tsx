import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms | Well Kept" };

export default function TermsPage() {
  return (
    <div className="landing-page stack legal-page">
      <section className="panel stack">
        <div>
          <div className="eyebrow">Well Kept</div>
          <h1>Terms of Use</h1>
          <p className="subtle">Last updated September 3, 2026</p>
        </div>
        <p>
          Well Kept is a marketplace that helps homeowners share cleaning requests and compare
          offers from independent cleaning providers. Well Kept does not itself provide cleaning
          services.
        </p>
        <h2>Using the marketplace</h2>
        <p>
          Provide accurate account, home, scheduling, and job information. Do not use the service
          for unlawful, misleading, abusive, or unsafe activity. You are responsible for reviewing
          an offer and deciding whether a provider is right for you.
        </p>
        <h2>Accounts and communications</h2>
        <p>
          Keep access to your email account secure. We may email one-time sign-in codes and
          operational updates about your account, jobs, and offers. SMS is not required to use the
          current service.
        </p>
        <h2>Jobs, offers, and changes</h2>
        <p>
          Posting a request does not guarantee an offer or booking. Pricing, timing, scope, and
          provider availability may change until an offer is accepted. You may cancel an open job
          before selecting a provider.
        </p>
        <h2>Service availability</h2>
        <p>
          The service may change, experience interruptions, or be unavailable in some areas. These
          terms may be updated as the marketplace develops; the date above will show the latest
          revision.
        </p>
        <p><Link href="/privacy">Read the Privacy Policy</Link> · <Link href="/">Return home</Link></p>
      </section>
    </div>
  );
}
