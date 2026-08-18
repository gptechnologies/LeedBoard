"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { triggerHaptic } from "@/lib/haptics";

export function CompleteJobAction({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  async function markComplete() {
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/cleaner/jobs/${jobId}/complete`, {
        method: "POST",
        headers: { "X-Well-Kept-Client": "1" },
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || "We couldn’t complete this job.");

      setComplete(true);
      setPending(false);
      triggerHaptic("success");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t complete this job.");
      setPending(false);
      triggerHaptic("warning");
    }
  }

  if (complete) return <p className="wk-inline-success" role="status"><Check aria-hidden="true" />Job marked complete</p>;

  if (!confirming) {
    return <button className="wk-inline-complete wk-pressable" onClick={() => { setConfirming(true); triggerHaptic("selection"); }} type="button">Mark job complete</button>;
  }

  return (
    <div className="wk-inline-confirmation">
      <p><strong>Is the cleaning finished?</strong><span>The homeowner will see the job as completed.</span></p>
      {error ? <small role="alert">{error}</small> : null}
      <div>
        <button disabled={pending} onClick={() => setConfirming(false)} type="button">Not yet</button>
        <button disabled={pending} onClick={markComplete} type="button">
          {pending ? <><LoaderCircle aria-hidden="true" className="wk-spin" />Saving</> : "Yes, complete"}
        </button>
      </div>
    </div>
  );
}
