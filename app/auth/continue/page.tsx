import { Suspense } from "react";
import { ContinueBridge } from "@/app/auth/continue/continue-bridge";

export const dynamic = "force-dynamic";

export default function ContinuePage() {
  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Setting up</div>
        <h1>Opening your Well Kept account.</h1>
        <p className="subtle">This should only take a moment.</p>
      </div>
      <Suspense fallback={null}>
        <ContinueBridge />
      </Suspense>
    </section>
  );
}
