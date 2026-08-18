"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { triggerHaptic } from "@/lib/haptics";

export function PassJobAction({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function passJob() {
    if (pending) return;
    setPending(true);
    setError("");
    triggerHaptic("warning");

    try {
      const response = await fetch(`/cleaner/jobs/${jobId}/pass`, { method: "POST" });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || "We couldn’t pass this job.");
      triggerHaptic("success");
      router.replace("/cleaner?passed=1");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t pass this job.");
      setPending(false);
      triggerHaptic("warning");
    }
  }

  if (!confirming) {
    return (
      <button className="wk-detail-pass-trigger" onClick={() => {
        setConfirming(true);
        triggerHaptic("selection");
      }} type="button">
        Pass on this job
      </button>
    );
  }

  return (
    <div className="wk-pass-confirmation">
      <div>
        <AlertCircle aria-hidden="true" />
        <span><strong>Pass on this job?</strong><small>You can restore it later from Account → Passed Jobs.</small></span>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <div className="wk-pass-confirmation__actions">
        <button disabled={pending} onClick={() => setConfirming(false)} type="button">Keep job</button>
        <button disabled={pending} onClick={passJob} type="button">
          {pending ? <><LoaderCircle aria-hidden="true" className="wk-spin" />Passing…</> : "Confirm pass"}
        </button>
      </div>
    </div>
  );
}
