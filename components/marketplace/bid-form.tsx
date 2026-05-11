"use client";

import { BidPricingType, ServiceNeed, TimingPreference } from "@prisma/client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { etaOptions, timeWindowOptions } from "@/lib/marketplace-constants";
import { PulsatingPrimaryButton } from "@/components/marketplace/motion-buttons";
import { PriceInput } from "@/components/marketplace/price-input";

type BidFormProps = {
  jobId: string;
  timingPreference: TimingPreference;
  requestedDate: Date | null;
  requestedWindowStart: string | null;
  requestedWindowEnd: string | null;
  serviceNeeds: ServiceNeed[];
  hasExistingBid?: boolean;
  defaults: {
    standardHourlyRateCents: number | null;
    standardFlatRateCents: number | null;
    standardDeepCleanFlatRateCents: number | null;
    defaultEtaMinutes: number | null;
  };
};

export function BidForm({
  jobId,
  timingPreference,
  requestedDate,
  requestedWindowStart,
  requestedWindowEnd,
  serviceNeeds,
  hasExistingBid = false,
  defaults,
}: BidFormProps) {
  const initialPricingType = defaults.standardFlatRateCents
    ? BidPricingType.FLAT
    : BidPricingType.HOURLY;
  const [pricingType, setPricingType] = useState<BidPricingType>(initialPricingType);
  const [hourlyRate, setHourlyRate] = useState(
    defaults.standardHourlyRateCents ? (defaults.standardHourlyRateCents / 100).toFixed(0) : "",
  );
  const [flatRate, setFlatRate] = useState(
    defaults.standardFlatRateCents ? (defaults.standardFlatRateCents / 100).toFixed(0) : "",
  );
  const [etaMinutes, setEtaMinutes] = useState(String(defaults.defaultEtaMinutes ?? 60));
  const [arrivalDate, setArrivalDate] = useState(
    requestedDate ? requestedDate.toISOString().slice(0, 10) : "",
  );
  const [windowStart, setWindowStart] = useState(
    requestedWindowStart ?? timeWindowOptions[0]?.start ?? "08:00",
  );
  const [message, setMessage] = useState("");
  const selectedWindow = timeWindowOptions.find((option) => option.start === windowStart);
  const quickTemplates = useMemo(() => {
    const templates: Array<{
      label: string;
      description: string;
      icon: "sparkle" | "brush" | "deep";
      pricingType: BidPricingType;
      amount: string;
      displayAmount: string;
    }> = [];

    if (defaults.standardHourlyRateCents) {
      const amount = (defaults.standardHourlyRateCents / 100).toFixed(0);
      templates.push({
        label: "Quick Clean",
        description: "Light refresh",
        icon: "sparkle",
        pricingType: BidPricingType.HOURLY,
        amount,
        displayAmount: `$${amount}/hr`,
      });
    }

    if (defaults.standardFlatRateCents) {
      const amount = (defaults.standardFlatRateCents / 100).toFixed(0);
      templates.push({
        label: "Standard Clean",
        description: "Whole-home rate",
        icon: "brush",
        pricingType: BidPricingType.FLAT,
        amount,
        displayAmount: `Flat $${amount}`,
      });
    }

    if (serviceNeeds.includes(ServiceNeed.DEEP_CLEAN) && defaults.standardDeepCleanFlatRateCents) {
      const amount = (defaults.standardDeepCleanFlatRateCents / 100).toFixed(0);
      templates.push({
        label: "Deep Clean",
        description: "Detailed clean",
        icon: "deep",
        pricingType: BidPricingType.FLAT,
        amount,
        displayAmount: `Flat $${amount}`,
      });
    }

    return templates;
  }, [defaults, serviceNeeds]);

  function applyTemplate(pricing: BidPricingType, amount: string) {
    setPricingType(pricing);

    if (pricing === BidPricingType.HOURLY) {
      setHourlyRate(amount);
    } else {
      setFlatRate(amount);
    }
  }

  return (
    <div className="bid-form-flow">
      {quickTemplates.length > 0 ? (
        <section className="bid-preset-section">
          <div className="bid-section-label">Use a saved preset</div>
          <div className="bid-preset-grid">
            {quickTemplates.map((template) => (
              <button
                key={template.label}
                type="button"
                className={
                  pricingType === template.pricingType &&
                  (template.pricingType === BidPricingType.HOURLY
                    ? hourlyRate === template.amount
                    : flatRate === template.amount)
                    ? "bid-preset-card active"
                    : "bid-preset-card"
                }
                onClick={() => applyTemplate(template.pricingType, template.amount)}
              >
                <PresetIcon name={template.icon} />
                <strong>{template.label}</strong>
                <span>{template.description}</span>
                <em>{template.displayAmount}</em>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="bid-divider">
        <span>{quickTemplates.length > 0 ? "Or make your own bid" : "Make your own bid"}</span>
      </div>

      <form action={`/cleaner/jobs/${jobId}/bid`} method="post" className="market-form bid-form-card">
        <section className="market-form-section stack">
          <div className="market-segmented bid-pricing-toggle">
            <label className={pricingType === BidPricingType.FLAT ? "market-segmented__option active" : "market-segmented__option"}>
              <input
                type="radio"
                name="pricingType"
                value={BidPricingType.FLAT}
                checked={pricingType === BidPricingType.FLAT}
                onChange={() => setPricingType(BidPricingType.FLAT)}
              />
              Flat Rate
            </label>
            <label className={pricingType === BidPricingType.HOURLY ? "market-segmented__option active" : "market-segmented__option"}>
              <input
                type="radio"
                name="pricingType"
                value={BidPricingType.HOURLY}
                checked={pricingType === BidPricingType.HOURLY}
                onChange={() => setPricingType(BidPricingType.HOURLY)}
              />
              Hourly
            </label>
          </div>
          {pricingType === BidPricingType.FLAT ? (
            <div className="field bid-price-field">
              <label htmlFor="flatRate">Your flat rate</label>
              <PriceInput
                id="flatRate"
                name="flatRate"
                value={flatRate}
                onChange={(event) => setFlatRate(event.target.value)}
                helperText="Total price for the job"
                required
              />
            </div>
          ) : (
            <div className="field bid-price-field">
              <label htmlFor="hourlyRate">Your hourly rate</label>
              <PriceInput
                id="hourlyRate"
                name="hourlyRate"
                value={hourlyRate}
                onChange={(event) => setHourlyRate(event.target.value)}
                helperText="Hourly rate for time on site"
                required
              />
            </div>
          )}
        </section>

        <section className="market-form-section stack">
          <div className="market-section-heading">
            <h2>{timingPreference === TimingPreference.ASAP ? "How soon can you arrive?" : "Arrival time"}</h2>
          </div>
          {timingPreference === TimingPreference.ASAP ? (
            <div className="market-chip-grid">
              {etaOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={etaMinutes === String(option.value) ? "market-chip-button active" : "market-chip-button"}
                  onClick={() => setEtaMinutes(String(option.value))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="arrivalDate">Arrival date</label>
                <input
                  id="arrivalDate"
                  name="arrivalDate"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={arrivalDate}
                  onChange={(event) => setArrivalDate(event.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="arrivalWindowStart">Arrival window</label>
                <select
                  id="arrivalWindowStart"
                  name="arrivalWindowStart"
                  value={windowStart}
                  onChange={(event) => setWindowStart(event.target.value)}
                >
                  {timeWindowOptions.map((option) => (
                    <option key={option.start} value={option.start}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </section>

        <section className="market-form-section stack">
          <div className="field">
            <label htmlFor="message">Optional note</label>
            <textarea
              id="message"
              name="message"
              maxLength={250}
              placeholder="Introduce yourself or add any details..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <span className="bid-message-count">{message.length}/250</span>
          </div>
        </section>

        {timingPreference === TimingPreference.ASAP ? (
          <input type="hidden" name="etaMinutes" value={etaMinutes} />
        ) : (
          <input
            type="hidden"
            name="arrivalWindowEnd"
            value={selectedWindow?.end ?? requestedWindowEnd ?? timeWindowOptions[0]?.end ?? "11:00"}
          />
        )}

        <div className="market-sticky-submit">
          <PulsatingPrimaryButton
            type="submit"
            className="w-full"
            disabled={
              timingPreference === TimingPreference.TIME_SLOT &&
              (!arrivalDate || !selectedWindow)
            }
          >
            {hasExistingBid ? "Update Bid" : "Send Bid"}
          </PulsatingPrimaryButton>
          <Link href="/cleaner" className="bid-cancel-link">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function PresetIcon({ name }: { name: "sparkle" | "brush" | "deep" }) {
  if (name === "brush") {
    return (
      <span className="bid-preset-card__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M14 4l6 6" />
          <path d="M13 5l6 6-7 7H6v-6z" />
          <path d="M6 18l-2 2" />
        </svg>
      </span>
    );
  }

  if (name === "deep") {
    return (
      <span className="bid-preset-card__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8 20h8" />
          <path d="M10 20l1-9h2l1 9" />
          <path d="M7 11h10" />
          <path d="M9 4h6l-1 7h-4z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="bid-preset-card__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z" />
        <path d="M5 4v4" />
        <path d="M3 6h4" />
        <path d="M19 16v4" />
        <path d="M17 18h4" />
      </svg>
    </span>
  );
}
