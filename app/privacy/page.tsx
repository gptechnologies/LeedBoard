import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy | Well Kept" };

export default function PrivacyPage() {
  return (
    <div className="landing-page stack legal-page">
      <section className="panel stack">
        <div>
          <div className="eyebrow">Well Kept</div>
          <h1>Privacy Policy</h1>
          <p className="subtle">Last updated November 4, 2026</p>
        </div>
        <p>
          This notice explains the information Well Kept uses to operate its
          home-cleaning marketplace and connect homeowners with cleaning
          providers.
        </p>
        <h2>Information we collect</h2>
        <p>
          We collect account details such as your name and email, home and job
          details you submit, offer and booking activity, and basic technical
          data needed to secure and operate the service.
        </p>
        <h2>How information is used</h2>
        <p>
          We use this information to verify accounts, publish and match job
          requests, display offers, support bookings, prevent misuse,
          troubleshoot the product, and send essential account or job emails.
        </p>
        <h2>Information shared with providers</h2>
        <p>
          Cleaning providers receive the job details needed to understand and
          price a request. Your name, email, phone, exact address, and access
          details are withheld from cleaners until you explicitly confirm one
          cleaner. Only that cleaner receives your introduction. Before
          selection, cleaners see the ZIP, home size, cleaning scope, and
          timing.
        </p>
        <h2>Your choices</h2>
        <p>
          You can update home details in your account and cancel an open job.
          Cleaners can pause or unsubscribe through their private email
          preferences link. Browser notification permission is optional. SMS is
          not required to create an account or post a job.
        </p>
        <h2>Retention and security</h2>
        <p>
          We retain information as needed to operate the marketplace, maintain
          records, resolve disputes, and meet legal obligations. No online
          service can guarantee absolute security.
        </p>
        <p>
          <Link href="/terms">Read the Terms of Use</Link> ·{" "}
          <Link href="/">Return home</Link>
        </p>
      </section>
    </div>
  );
}
