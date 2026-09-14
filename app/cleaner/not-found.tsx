import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";

export default function CleanerNotFound() {
  return (
    <div className="wk-app-screen wk-recovery-screen">
      <AppScreenHeader brandHref="/cleaner" />
      <section className="wk-recovery-state">
        <span aria-hidden="true"><SearchX /></span>
        <p className="market-kicker">Job unavailable</p>
        <h1>This job is no longer open.</h1>
        <p>The homeowner may have booked a cleaner or closed the request.</p>
        <Link className="button-link wk-pressable" href="/cleaner">
          <ArrowLeft aria-hidden="true" /> Browse open jobs
        </Link>
      </section>
    </div>
  );
}
