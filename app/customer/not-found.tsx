import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

export default function CustomerNotFound() {
  return (
    <div className="wk-app-screen wk-recovery-screen">
      <section className="wk-recovery-state">
        <span aria-hidden="true"><SearchX /></span>
        <p className="market-kicker">Nothing here</p>
        <h1>We couldn’t find that job.</h1>
        <p>It may have been removed or the link may be out of date.</p>
        <Link className="button-link wk-pressable" href="/customer/jobs">
          <ArrowLeft aria-hidden="true" /> Back to activity
        </Link>
      </section>
    </div>
  );
}
