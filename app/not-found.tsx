import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wk-recovery-state wk-recovery-state--public">
      <span aria-hidden="true"><SearchX /></span>
      <p className="eyebrow">Page not found</p>
      <h1>That page isn’t here.</h1>
      <p>Check the address or return to the Well Kept home page.</p>
      <Link className="button-link wk-pressable" href="/">
        <ArrowLeft aria-hidden="true" /> Return home
      </Link>
    </section>
  );
}
