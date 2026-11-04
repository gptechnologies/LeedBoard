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
  triggerLabel = "Choose cleaner",
  bidVersion,
}: {
  bidId: string;
  jobId: string;
  jobTitle: string;
  price: string;
  providerName: string;
  timing: string;
  triggerLabel?: string;
  bidVersion?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "confirming" | "selected">(
    "idle",
  );
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [firstName, setFirstName] = useState("");

  async function chooseProvider() {
    setState("confirming");
    setError("");

    const formData = new FormData();
    formData.set("bidId", bidId);
    formData.set("bidVersion", bidVersion ?? "");
    formData.set("addressLine1", address);
    formData.set("city", city);
    formData.set("state", region);
    formData.set("firstName", firstName);

    try {
      const response = await fetch(`/customer/jobs/${jobId}/accept-bid`, {
        method: "POST",
        body: formData,
        headers: { "X-Well-Kept-Client": "1" },
      });
      const result = (await response.json()) as {
        bidId?: string;
        error?: string;
      };

      if (!response.ok || !result.bidId) {
        throw new Error(
          result.error ||
            "We couldn’t choose this provider. Refresh the bids and try again.",
        );
      }

      setState("selected");
      triggerHaptic("success");
      router.push(`/customer#job-${jobId}`);
      router.refresh();
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
    <div
      className={`wk-provider-select${state === "selected" ? " is-selected" : ""}`}
    >
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button
            className="wk-provider-select__trigger wk-pressable"
            type="button"
          >
            {state === "selected" ? <Check aria-hidden="true" /> : null}
            {state === "selected" ? "Provider selected" : triggerLabel}
          </button>
        </DrawerTrigger>
        <DrawerContent className="wk-provider-drawer">
          <DrawerHeader>
            <div className="wk-provider-drawer__icon" aria-hidden="true">
              {state === "selected" ? <Check /> : <ShieldCheck />}
            </div>
            <DrawerTitle>
              {state === "selected"
                ? "Provider selected"
                : `Choose ${providerName}?`}
            </DrawerTitle>
            <DrawerDescription>
              {state === "selected"
                ? "The confirmed address and access details are ready in the active job."
                : "Review the job and timing before you confirm."}
            </DrawerDescription>
          </DrawerHeader>

          <dl className="wk-provider-drawer__summary">
            <div>
              <dt>Provider</dt>
              <dd>{providerName}</dd>
            </div>
            <div>
              <dt>Job</dt>
              <dd>{jobTitle}</dd>
            </div>
            <div>
              <dt>Arrival</dt>
              <dd>{timing}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{price}</dd>
            </div>
          </dl>

          <div
            className="effortless-form"
            style={{ margin: "0 auto", gap: 12 }}
          >
            <label>
              First name
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
            </label>
            <label>
              Street address
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
                required
              />
            </label>
            <div className="effortless-grid">
              <label>
                City
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  required
                />
              </label>
              <label>
                State
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  autoComplete="address-level1"
                  required
                />
              </label>
            </div>
            <p>
              Your name, verified email, and this address will be shared with
              this cleaner only. Any phone number already saved to your account
              will also be shared.
            </p>
          </div>
          <p className="wk-provider-drawer__payment">
            Well Kept connects you with the provider. Payment is handled
            directly with them.
          </p>

          {error ? (
            <p className="wk-form-error" role="alert">
              {error}
            </p>
          ) : null}

          <DrawerFooter>
            <Button
              className="wk-pressable h-11"
              disabled={
                state !== "idle" ||
                !address.trim() ||
                !city.trim() ||
                !region.trim() ||
                !firstName.trim()
              }
              onClick={chooseProvider}
              type="button"
            >
              {state === "confirming" ? (
                <>
                  <LoaderCircle
                    className="wk-button-spinner"
                    aria-hidden="true"
                  />{" "}
                  Choosing provider
                </>
              ) : state === "selected" ? (
                <>
                  <Check aria-hidden="true" /> Provider selected
                </>
              ) : (
                "Confirm and share details"
              )}
            </Button>
            {state === "idle" ? (
              <DrawerClose asChild>
                <Button className="h-11" variant="ghost" type="button">
                  Keep reviewing
                </Button>
              </DrawerClose>
            ) : null}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
