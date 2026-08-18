"use client";

import { BidPricingType, TimingPreference } from "@prisma/client";
import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import { CleanerUpNextJobCardContent, type CleanerUpNextJob } from "@/components/marketplace/cleaner-up-next-job-card";
import { PulsatingPrimaryButton } from "@/components/marketplace/motion-buttons";
import { PriceInput } from "@/components/marketplace/price-input";
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
import { timeWindowOptions } from "@/lib/marketplace-constants";
import { triggerHaptic } from "@/lib/haptics";

type FastBidDefaults = {
  standardHourlyRateCents: number | null;
  standardFlatRateCents: number | null;
  defaultEtaMinutes: number | null;
};

const etaOptions = [
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "2+ hrs" },
];

const fallbackWindow = { start: "08:00", end: "11:00", label: "8:00 AM - 11:00 AM" };

export function FastBidDrawer({
  defaults,
  job,
  timingLabel,
  trigger,
  triggerMode = "card",
}: {
  defaults: FastBidDefaults;
  job: CleanerUpNextJob;
  timingLabel: string;
  trigger?: ReactNode;
  triggerMode?: "card" | "button";
}) {
  const router = useRouter();
  const initialPricingType = defaults.standardFlatRateCents
    ? BidPricingType.FLAT
    : BidPricingType.HOURLY;
  const [pricingType, setPricingType] = useState<BidPricingType>(initialPricingType);
  const [flatRate, setFlatRate] = useState(
    defaults.standardFlatRateCents ? (defaults.standardFlatRateCents / 100).toFixed(0) : "",
  );
  const [hourlyRate, setHourlyRate] = useState(
    defaults.standardHourlyRateCents ? (defaults.standardHourlyRateCents / 100).toFixed(0) : "",
  );
  const [etaMinutes, setEtaMinutes] = useState(String(defaults.defaultEtaMinutes ?? 60));
  const [timeConfirmed, setTimeConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success">("idle");
  const [submitError, setSubmitError] = useState("");

  const priceValue = pricingType === BidPricingType.FLAT ? flatRate : hourlyRate;
  const priceNumber = Number(priceValue);
  const hasValidPrice = Number.isFinite(priceNumber) && priceNumber > 0;
  const isAsap = job.timingPreference === TimingPreference.ASAP;
  const selectedWindow = useMemo(
    () =>
      timeWindowOptions.find((option) => option.start === job.requestedWindowStart) ??
      timeWindowOptions[0] ??
      fallbackWindow,
    [job.requestedWindowStart],
  );
  const arrivalDateValue = formatDateInputValue(job.requestedDate);
  const canSubmit = hasValidPrice && (isAsap ? Boolean(etaMinutes) : timeConfirmed && Boolean(arrivalDateValue));
  const submitGuidance = !hasValidPrice
    ? "Enter your price to continue."
    : !isAsap && !timeConfirmed
      ? "Confirm the requested time to continue."
      : "Your bid is ready to send.";

  function choosePricingType(value: BidPricingType) {
    setPricingType(value);
    triggerHaptic("selection");
  }

  async function submitBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || submitState !== "idle") return;

    setSubmitError("");
    setSubmitState("submitting");

    try {
      const response = await fetch(event.currentTarget.action, {
        method: "POST",
        body: new FormData(event.currentTarget),
        headers: { "X-Well-Kept-Client": "1" },
      });
      const result = (await response.json()) as { bidId?: string; error?: string };

      if (!response.ok || !result.bidId) {
        throw new Error(result.error || "We couldn’t submit your bid. Try again.");
      }

      setSubmitState("success");
      triggerHaptic("success");
      window.setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 650);
    } catch (error) {
      setSubmitState("idle");
      setSubmitError(error instanceof Error ? error.message : "We couldn’t submit your bid. Try again.");
      triggerHaptic("warning");
    }
  }

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => {
      if (submitState === "submitting") return;
      setOpen(nextOpen);
    }}>
      <DrawerTrigger asChild>
        {trigger ?? (
          triggerMode === "button" ? (
            <PulsatingPrimaryButton type="button" className="cleaner-detail-place-bid-button">
              Place Bid
            </PulsatingPrimaryButton>
          ) : (
            <div
              role="button"
              tabIndex={0}
              className="cleaner-upnext-button"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.currentTarget.click();
                }
              }}
            >
              <CleanerUpNextJobCardContent
                className="cleaner-upnext-card--nearby"
                job={job}
                showBidCta
                timingLabel={timingLabel}
              />
            </div>
          )
        )}
      </DrawerTrigger>
      <DrawerContent className="fast-bid-drawer">
        <DrawerHeader className="fast-bid-drawer__header">
          <DrawerTitle>Place your bid</DrawerTitle>
          <DrawerDescription>
            Choose a price and {isAsap ? "how soon you can arrive." : "confirm the requested time."}
          </DrawerDescription>
        </DrawerHeader>

        <form action={`/cleaner/jobs/${job.id}/bid`} method="post" className="fast-bid-form" onSubmit={submitBid}>
          <div className="fast-bid-form__body">
            <div className="market-segmented fast-bid-toggle">
              <label className={pricingType === BidPricingType.FLAT ? "market-segmented__option active" : "market-segmented__option"}>
                <input
                  type="radio"
                  name="pricingType"
                  value={BidPricingType.FLAT}
                  checked={pricingType === BidPricingType.FLAT}
                  onChange={() => choosePricingType(BidPricingType.FLAT)}
                />
                Total Price
              </label>
              <label className={pricingType === BidPricingType.HOURLY ? "market-segmented__option active" : "market-segmented__option"}>
                <input
                  type="radio"
                  name="pricingType"
                  value={BidPricingType.HOURLY}
                  checked={pricingType === BidPricingType.HOURLY}
                  onChange={() => choosePricingType(BidPricingType.HOURLY)}
                />
                Hourly Price
              </label>
            </div>

            <div className="field fast-bid-price-field">
              <label htmlFor={`fast-bid-price-${job.id}`}>Your price</label>
              {pricingType === BidPricingType.FLAT ? (
                <PriceInput
                  id={`fast-bid-price-${job.id}`}
                  name="flatRate"
                  placeholder="120.00"
                  required
                  value={flatRate}
                  onChange={(event) => setFlatRate(event.target.value)}
                />
              ) : (
                <PriceInput
                  id={`fast-bid-price-${job.id}`}
                  name="hourlyRate"
                  placeholder="30.00"
                  required
                  value={hourlyRate}
                  onChange={(event) => setHourlyRate(event.target.value)}
                />
              )}
            </div>

            {isAsap ? (
              <section className="fast-bid-section">
                <h3>How soon can you arrive?</h3>
                <div className="fast-bid-eta-grid">
                  {etaOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={etaMinutes === String(option.value) ? "fast-bid-choice active" : "fast-bid-choice"}
                      onClick={() => {
                        setEtaMinutes(String(option.value));
                        triggerHaptic("selection");
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p>Only bid if this timing works for your schedule.</p>
                <input type="hidden" name="etaMinutes" value={etaMinutes} />
              </section>
            ) : (
              <section className="fast-bid-section">
                <h3>Confirm the time works</h3>
                <button
                  type="button"
                  className={timeConfirmed ? "fast-bid-time-confirm active" : "fast-bid-time-confirm"}
                  onClick={() => {
                    setTimeConfirmed((value) => !value);
                    triggerHaptic("selection");
                  }}
                >
                  <strong>Confirm {formatRequestedDate(job.requestedDate)} works</strong>
                  <span>{formatWindow(job.requestedWindowStart, job.requestedWindowEnd)}</span>
                </button>
                <input type="hidden" name="arrivalDate" value={arrivalDateValue} />
                <input type="hidden" name="arrivalWindowStart" value={job.requestedWindowStart ?? selectedWindow.start} />
                <input type="hidden" name="arrivalWindowEnd" value={job.requestedWindowEnd ?? selectedWindow.end} />
              </section>
            )}

            <section className="fast-bid-section">
              <div className="field">
                <label htmlFor={`fast-bid-message-${job.id}`}>Note to homeowner</label>
                <textarea
                  id={`fast-bid-message-${job.id}`}
                  name="message"
                  maxLength={250}
                  placeholder="Share supplies, timing details, or anything they should know."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <span className="bid-message-count">{message.length}/250</span>
              </div>
            </section>
          </div>

          <DrawerFooter className="fast-bid-drawer__footer">
            {submitError ? <p className="wk-form-error" role="alert">{submitError}</p> : null}
            {!submitError && submitState === "idle" ? (
              <p className={canSubmit ? "fast-bid-guidance is-ready" : "fast-bid-guidance"} aria-live="polite">
                {submitGuidance}
              </p>
            ) : null}
            <Button
              aria-busy={submitState === "submitting"}
              type="submit"
              disabled={!canSubmit || submitState !== "idle"}
              className="fast-bid-submit"
            >
              {submitState === "submitting" ? (
                <><LoaderCircle className="wk-button-spinner" aria-hidden="true" /> Sending bid</>
              ) : submitState === "success" ? (
                <><Check aria-hidden="true" /> Bid sent</>
              ) : (
                "Place bid"
              )}
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="ghost" className="fast-bid-cancel" disabled={submitState !== "idle"}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function formatDateInputValue(value: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function formatRequestedDate(value: Date | string | null) {
  if (!value) return "the requested time";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "the requested time";

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  return `${weekday}, ${month} ${day}${getOrdinalSuffix(day)}`;
}

function formatWindow(start: string | null, end: string | null) {
  if (!start || !end) return "Requested arrival window";
  return `${formatClock(start)} - ${formatClock(end)}`;
}

function formatClock(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOrdinalSuffix(day: number) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
