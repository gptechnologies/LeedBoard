"use client";

import { Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { triggerHaptic } from "@/lib/haptics";

export function ProviderSelectionDrawer({
  bidId,
  jobId,
  jobTitle,
  price,
  providerName,
  timing,
}: {
  bidId: string;
  jobId: string;
  jobTitle: string;
  price: string;
  providerName: string;
  timing: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "confirming" | "selected">("idle");
  const [error, setError] = useState("");

  async function chooseProvider() {
    setState("confirming");
    setError("");

    const formData = new FormData();
    formData.set("bidId", bidId);

    try {
      const response = await fetch(`/customer/jobs/${jobId}/accept-bid`, {
        method: "POST",
        body: formData,
        headers: { "X-Well-Kept-Client": "1" },
      });
      const result = (await response.json()) as { bidId?: string; error?: string };

      if (!response.ok || !result.bidId) {
        throw new Error(result.error || "We couldn’t choose this provider. Refresh the bids and try again.");
      }

      setState("selected");
      triggerHaptic("success");
      window.setTimeout(() => router.push(`/customer/messages/${result.bidId}`), 650);
    } catch (selectionError) {
      setState("idle");
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : "We couldn’t choose this provider. Refresh the bids and try again.",
      );
      triggerHaptic("warning");
    }
  }

  return (
    <div className={`wk-provider-select${state === "selected" ? " is-selected" : ""}`}>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button className="wk-provider-select__trigger wk-pressable" type="button">
            {state === "selected" ? <Check aria-hidden="true" /> : null}
            {state === "selected" ? "Provider selected" : "Choose Provider"}
          </button>
        </DrawerTrigger>
        <DrawerContent className="wk-provider-drawer">
          <DrawerHeader>
            <div className="wk-provider-drawer__icon" aria-hidden="true">
              {state === "selected" ? <Check /> : <ShieldCheck />}
            </div>
            <DrawerTitle>
              {state === "selected" ? "Provider selected" : `Choose ${providerName}?`}
            </DrawerTitle>
            <DrawerDescription>
              {state === "selected"
                ? "The confirmed address and access details are ready in the active job."
                : "Review the job and timing before you confirm."}
            </DrawerDescription>
          </DrawerHeader>

          <dl className="wk-provider-drawer__summary">
            <div><dt>Provider</dt><dd>{providerName}</dd></div>
            <div><dt>Job</dt><dd>{jobTitle}</dd></div>
            <div><dt>Arrival</dt><dd>{timing}</dd></div>
            <div><dt>Price</dt><dd>{price}</dd></div>
          </dl>

          <p className="wk-provider-drawer__payment">
            Well Kept connects you with the provider. Payment is handled directly with them.
          </p>

          {error ? <p className="wk-form-error" role="alert">{error}</p> : null}

          <DrawerFooter>
            <Button
              className="wk-pressable"
              disabled={state !== "idle"}
              onClick={chooseProvider}
              type="button"
            >
              {state === "confirming" ? (
                <><LoaderCircle className="wk-button-spinner" aria-hidden="true" /> Choosing provider</>
              ) : state === "selected" ? (
                <><Check aria-hidden="true" /> Provider selected</>
              ) : (
                "Confirm Provider"
              )}
            </Button>
            {state === "idle" ? (
              <DrawerClose asChild>
                <Button variant="ghost" type="button">Keep reviewing</Button>
              </DrawerClose>
            ) : null}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
