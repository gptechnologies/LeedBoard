"use client";

import { OfferType, TimingPreference } from "@prisma/client";
import { useState } from "react";

type ProviderResponseFormProps = {
  token: string;
  timingPreference: TimingPreference;
  requestedDate: string | null;
  requestedTime: string | null;
};

const offerTypes = [
  { value: OfferType.FIXED_PRICE, label: "Fixed price", detail: "One total price" },
  { value: OfferType.ESTIMATE, label: "Estimate", detail: "A price or range" },
  { value: OfferType.HOURLY, label: "Hourly", detail: "Rate per hour" },
  { value: OfferType.FREE_QUOTE, label: "Free quote", detail: "See the home first" },
  { value: OfferType.NEEDS_DETAILS, label: "Need details", detail: "Ask one question" },
];

export function ProviderResponseForm({
  token,
  timingPreference,
  requestedDate,
  requestedTime,
}: ProviderResponseFormProps) {
  const [offerType, setOfferType] = useState<OfferType>(OfferType.FIXED_PRICE);
  const [scheduleAccepted, setScheduleAccepted] = useState(true);

  return (
    <form
      action={`/invite/cleaner/${token}/offer`}
      method="post"
      className="provider-response-form"
    >
      <section className="provider-form-section">
        <div className="provider-section-heading">
          <span>01</span>
          <div>
            <h2>Choose your offer</h2>
            <p>The homeowner will see this label beside your price.</p>
          </div>
        </div>

        <div className="provider-offer-type-grid">
          {offerTypes.map((option) => (
            <label
              key={option.value}
              className={offerType === option.value ? "provider-choice is-selected" : "provider-choice"}
            >
              <input
                type="radio"
                name="offerType"
                value={option.value}
                checked={offerType === option.value}
                onChange={() => setOfferType(option.value)}
              />
              <strong>{option.label}</strong>
              <span>{option.detail}</span>
            </label>
          ))}
        </div>

        {offerType === OfferType.FIXED_PRICE ? (
          <MoneyField id="price" name="price" label="Total job price" required />
        ) : null}

        {offerType === OfferType.HOURLY ? (
          <div className="provider-field-grid">
            <MoneyField id="hourlyRate" name="hourlyRate" label="Hourly rate" required suffix="/ hour" />
            <div className="provider-field">
              <label htmlFor="estimatedHours">Estimated hours</label>
              <input id="estimatedHours" name="estimatedHours" type="number" min="0.5" max="24" step="0.5" inputMode="decimal" placeholder="3" />
            </div>
          </div>
        ) : null}

        {offerType === OfferType.ESTIMATE ? (
          <div className="provider-field-grid">
            <MoneyField id="priceMin" name="priceMin" label="Estimate from" required />
            <MoneyField id="priceMax" name="priceMax" label="Estimate up to" />
          </div>
        ) : null}

        {offerType === OfferType.NEEDS_DETAILS ? (
          <div className="provider-field">
            <label htmlFor="providerQuestion">What do you need to know?</label>
            <textarea
              id="providerQuestion"
              name="providerQuestion"
              required
              maxLength={300}
              placeholder="For example: Are the floors mostly hardwood or carpet?"
            />
          </div>
        ) : null}
      </section>

      <section className="provider-form-section">
        <div className="provider-section-heading">
          <span>02</span>
          <div>
            <h2>Confirm your availability</h2>
            <p>Let the homeowner know whether their requested time works.</p>
          </div>
        </div>

        <div className="provider-schedule-choice">
          <label className={scheduleAccepted ? "is-selected" : ""}>
            <input
              type="radio"
              name="requestedScheduleAccepted"
              value="true"
              checked={scheduleAccepted}
              onChange={() => setScheduleAccepted(true)}
            />
            <strong>Yes, that works</strong>
            <span>
              {timingPreference === TimingPreference.ASAP
                ? "I can share an arrival time below"
                : "I can meet the requested window"}
            </span>
          </label>
          <label className={!scheduleAccepted ? "is-selected" : ""}>
            <input
              type="radio"
              name="requestedScheduleAccepted"
              value="false"
              checked={!scheduleAccepted}
              onChange={() => setScheduleAccepted(false)}
            />
            <strong>No, suggest another time</strong>
            <span>I am available at a different time</span>
          </label>
        </div>

        {!scheduleAccepted || timingPreference === TimingPreference.ASAP ? (
          <div className="provider-field-grid">
            <div className="provider-field">
              <label htmlFor="availableDate">Available date</label>
              <input
                id="availableDate"
                name="availableDate"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                defaultValue={requestedDate ?? ""}
                required
              />
            </div>
            <div className="provider-field">
              <label htmlFor="arrivalTime">Arrival time</label>
              <input
                id="arrivalTime"
                name="arrivalTime"
                type="time"
                defaultValue={requestedTime ?? ""}
                required
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="provider-form-section">
        <div className="provider-section-heading">
          <span>03</span>
          <div>
            <h2>Add a note</h2>
            <p>Optional conditions or helpful context for the homeowner.</p>
          </div>
        </div>
        <div className="provider-field">
          <label htmlFor="message">Anything the homeowner should know?</label>
          <textarea
            id="message"
            name="message"
            maxLength={350}
            placeholder="Price assumes a standard cleaning condition."
          />
        </div>
      </section>

      <div className="provider-submit-bar">
        <p>No account or app required.</p>
        <button type="submit">Submit offer</button>
      </div>
    </form>
  );
}

function MoneyField({
  id,
  label,
  name,
  required = false,
  suffix,
}: {
  id: string;
  label: string;
  name: string;
  required?: boolean;
  suffix?: string;
}) {
  return (
    <div className="provider-field">
      <label htmlFor={id}>{label}</label>
      <div className="provider-money-input">
        <span>$</span>
        <input
          id={id}
          name={name}
          type="number"
          min="1"
          max="10000"
          step="1"
          inputMode="decimal"
          placeholder="150"
          required={required}
        />
        {suffix ? <em>{suffix}</em> : null}
      </div>
    </div>
  );
}
