"use client";

import { LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { triggerHaptic } from "@/lib/haptics";

export function RestorePassedJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState("");

  async function restore() {
    if (pending) return;
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/cleaner/jobs/${jobId}/restore`, { method: "POST" });
      if (!response.ok) throw new Error("We couldn’t restore this job.");
      setRestored(true);
      triggerHaptic("success");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t restore this job.");
      setPending(false);
      triggerHaptic("warning");
    }
  }

  if (restored) return <span className="wk-passed-job__restored" role="status">Moved back to Open Jobs</span>;

  return (
    <div className="wk-passed-job__restore">
      <button disabled={pending} onClick={restore} type="button">
        {pending ? <LoaderCircle aria-hidden="true" className="wk-spin" /> : <RotateCcw aria-hidden="true" />}
        {pending ? "Moving…" : "Move Back to Open Jobs"}
      </button>
      {error ? <small role="alert">{error}</small> : null}
    </div>
  );
}
