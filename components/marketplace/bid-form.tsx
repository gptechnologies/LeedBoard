"use client";

import { BidPricingType, ServiceNeed, TimingPreference } from "@prisma/client";
import { useMemo, useState } from "react";
import { etaOptions, timeWindowOptions } from "@/lib/marketplace-constants";

type BidFormProps = {
  jobId: string;
  timingPreference: TimingPreference;
  requestedDate: Date | null;
  requestedWindowStart: string | null;
  requestedWindowEnd: string | null;
  serviceNeeds: ServiceNeed[];
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
  defaults,
}: BidFormProps) {
  const [pricingType, setPricingType] = useState<BidPricingType>(BidPricingType.HOURLY);
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
  const selectedWindow = timeWindowOptions.find((option) => option.start === windowStart);
  const quickTemplates = useMemo(() => {
    const templates: Array<{
      label: string;
      pricingType: BidPricingType;
      amount: string;
    }> = [];

    if (defaults.standardFlatRateCents) {
      templates.push({
        label: "$" + (defaults.standardFlatRateCents / 100).toFixed(0) + " Standard",
        pricingType: BidPricingType.FLAT,
        amount: (defaults.standardFlatRateCents / 100).toFixed(0),
      });
    }

    if (serviceNeeds.includes(ServiceNeed.DEEP_CLEAN) && defaults.standardDeepCleanFlatRateCents) {
      templates.push({
        label: "$" + (defaults.standardDeepCleanFlatRateCents / 100).toFixed(0) + " Deep Clean",
        pricingType: BidPricingType.FLAT,
        amount: (defaults.standardDeepCleanFlatRateCents / 100).toFixed(0),
      });
    }

    if (defaults.standardHourlyRateCents) {
      templates.push({
        label: "$" + (defaults.standardHourlyRateCents / 100).toFixed(0) + "/hr",
        pricingType: BidPricingType.HOURLY,
        amount: (defaults.standardHourlyRateCents / 100).toFixed(0),
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
    <div className="stack">
      {quickTemplates.length > 0 ? (
        <section className="market-card stack">
          <div className="market-section-heading">
            <h2>Bid quick</h2>
            <span>Use your saved defaults</span>
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
          ) : null}
          <div className="market-quick-bid-grid">
            {quickTemplates.map((template) => (
              <form key={template.label} action={`/cleaner/jobs/${jobId}/bid`} method="post">
                <input type="hidden" name="pricingType" value={template.pricingType} />
                {template.pricingType === BidPricingType.HOURLY ? (
                  <input type="hidden" name="hourlyRate" value={template.amount} />
                ) : (
                  <input type="hidden" name="flatRate" value={template.amount} />
                )}
                {timingPreference === TimingPreference.ASAP ? (
                  <input type="hidden" name="etaMinutes" value={etaMinutes} />
                ) : (
                  <>
                    <input type="hidden" name="arrivalDate" value={requestedDate ? requestedDate.toISOString().slice(0, 10) : ""} />
                    <input type="hidden" name="arrivalWindowStart" value={requestedWindowStart ?? ""} />
                    <input type="hidden" name="arrivalWindowEnd" value={requestedWindowEnd ?? ""} />
                  </>
                )}
                <button type="submit" className="market-quick-bid-button">
                  {template.label}
                </button>
              </form>
            ))}
          </div>
          <div className="market-chip-grid">
            {quickTemplates.map((template) => (
              <button
                key={`${template.label}-custom`}
                type="button"
                className="market-chip-button"
                onClick={() => applyTemplate(template.pricingType, template.amount)}
              >
                Edit {template.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <form action={`/cleaner/jobs/${jobId}/bid`} method="post" className="market-form stack">
        <section className="market-form-section stack">
          <div className="market-section-heading">
            <h2>Your price</h2>
          </div>
          <div className="market-segmented">
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
            <label className={pricingType === BidPricingType.FLAT ? "market-segmented__option active" : "market-segmented__option"}>
              <input
                type="radio"
                name="pricingType"
                value={BidPricingType.FLAT}
                checked={pricingType === BidPricingType.FLAT}
                onChange={() => setPricingType(BidPricingType.FLAT)}
              />
              Flat Fee
            </label>
          </div>
          {pricingType === BidPricingType.HOURLY ? (
            <div className="field">
              <label htmlFor="hourlyRate">Hourly rate</label>
              <input
                id="hourlyRate"
                name="hourlyRate"
                inputMode="decimal"
                value={hourlyRate}
                onChange={(event) => setHourlyRate(event.target.value)}
                required
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="flatRate">Flat fee</label>
              <input
                id="flatRate"
                name="flatRate"
                inputMode="decimal"
                value={flatRate}
                onChange={(event) => setFlatRate(event.target.value)}
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
              placeholder="Share what is included in your quote or any timing details."
            />
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
          <button
            type="submit"
            disabled={
              timingPreference === TimingPreference.TIME_SLOT &&
              (!arrivalDate || !selectedWindow)
            }
          >
            Submit Bid
          </button>
        </div>
      </form>
    </div>
  );
}
