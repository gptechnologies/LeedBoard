"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { triggerHaptic } from "@/lib/haptics";

export function JobOptionsSheet({ children, hasBids, jobId, status }: { children: ReactNode; hasBids: boolean; jobId: string; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const canDelete = status === "OPEN" || status === "EXPIRED";

  function clearPress() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch" || (event.target as HTMLElement).closest("a, button, input, textarea")) return;
    clearPress();
    start.current = { x: event.clientX, y: event.clientY };
    timer.current = setTimeout(() => {
      timer.current = null;
      start.current = null;
      triggerHaptic("selection");
      setOpen(true);
    }, 450);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (start.current && Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > 10) clearPress();
  }

  async function deleteJob() {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/customer/jobs/${jobId}/delete`, { method: "POST", headers: { "X-Well-Kept-Client": "1" } });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not delete this job.");
      triggerHaptic("success");
      setOpen(false);
      router.refresh();
    } catch (cause) {
      triggerHaptic("warning");
      setError(cause instanceof Error ? cause.message : "Could not delete this job.");
    } finally {
      setDeleting(false);
    }
  }

  return <>
    <div
      className="homeowner-job-options-target"
      onContextMenu={(event) => { event.preventDefault(); clearPress(); setOpen(true); }}
      onPointerCancel={clearPress}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clearPress}
    >
      {children}
      <button className="homeowner-job-options-trigger" type="button" aria-label="Job options" onClick={() => setOpen(true)}><MoreHorizontal aria-hidden="true" /></button>
    </div>
    <Drawer open={open} onOpenChange={(value) => { setOpen(value); if (!value) { setConfirming(false); setError(""); } }}>
      <DrawerContent className="wk-job-options-sheet">
        <DrawerHeader>
          <DrawerTitle>{confirming ? "Delete this job?" : "Job options"}</DrawerTitle>
          {confirming ? <DrawerDescription>{hasBids ? "This will close the job and notify cleaners who have already submitted bids." : "Cleaners will no longer be able to view or bid on this job."}</DrawerDescription> : null}
        </DrawerHeader>
        {error ? <p className="wk-job-options-error" role="alert">{error}</p> : null}
        <DrawerFooter>
          {confirming ? <>
            <button className="wk-job-options-secondary" type="button" onClick={() => setConfirming(false)}>Cancel</button>
            <button className="wk-job-options-danger" type="button" disabled={deleting} onClick={deleteJob}>{deleting ? "Deleting…" : "Delete job"}</button>
          </> : <>
            {canDelete ? <button className="wk-job-options-primary" type="button" onClick={() => setConfirming(true)}><Trash2 aria-hidden="true" /> Delete job</button> : <p className="wk-job-options-help">A chosen cleaner is connected to this job. It can’t be deleted as a posting.</p>}
            <DrawerClose asChild><button className="wk-job-options-secondary" type="button">{canDelete ? "Cancel" : "Close"}</button></DrawerClose>
          </>}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </>;
}
