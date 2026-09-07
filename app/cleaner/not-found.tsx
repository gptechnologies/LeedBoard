import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

export default function CleanerNotFound() {
  return (
    <div className="wk-app-screen wk-recovery-screen">
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
