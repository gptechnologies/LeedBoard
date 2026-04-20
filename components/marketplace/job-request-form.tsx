"use client";

import Link from "next/link";
import {
  CleanLevel,
  EntryMethod,
  RoomType,
  ServiceNeed,
  TimingPreference,
} from "@prisma/client";
import { FormEvent, useState } from "react";
import {
  cleanLevelOptions,
  entryMethodOptions,
  roomTypeOptions,
  timeWindowOptions,
} from "@/lib/marketplace-constants";

type WizardHomeProfile = {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  entryMethod: EntryMethod;
  entryNotes: string | null;
  defaultRoomTypes: RoomType[];
  defaultCleanLevel: CleanLevel;
  notes: string | null;
} | null;

const steps = ["Home", "Rooms + Level", "Timing + Access", "Review"] as const;

export function JobRequestForm({ defaultHomeProfile }: { defaultHomeProfile: WizardHomeProfile }) {
  const [step, setStep] = useState(0);
  const [addressLine1, setAddressLine1] = useState(defaultHomeProfile?.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(defaultHomeProfile?.addressLine2 ?? "");
  const [city, setCity] = useState(defaultHomeProfile?.city ?? "");
  const [state, setState] = useState(defaultHomeProfile?.state ?? "CA");
  const [postalCode, setPostalCode] = useState(defaultHomeProfile?.postalCode ?? "");
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(defaultHomeProfile?.defaultRoomTypes ?? []);
  const [cleanLevel, setCleanLevel] = useState<CleanLevel>(
    defaultHomeProfile?.defaultCleanLevel ?? CleanLevel.MEDIUM,
  );
  const [entryMethod, setEntryMethod] = useState<EntryMethod>(
    defaultHomeProfile?.entryMethod ?? EntryMethod.I_WILL_BE_HOME,
  );
  const [entryNotes, setEntryNotes] = useState(defaultHomeProfile?.entryNotes ?? "");
  const [timingPreference, setTimingPreference] = useState<TimingPreference>(TimingPreference.ASAP);
  const [requestedDate, setRequestedDate] = useState("");
  const [windowStart, setWindowStart] = useState(timeWindowOptions[0]?.start ?? "08:00");
  const [notes, setNotes] = useState("");
  const selectedWindow = timeWindowOptions.find((option) => option.start === windowStart);
  const serviceNeeds = deriveServiceNeeds(roomTypes, cleanLevel);
  const isUsingPreset =
    !!defaultHomeProfile &&
    addressLine1 === defaultHomeProfile.addressLine1 &&
    addressLine2 === (defaultHomeProfile.addressLine2 ?? "") &&
    city === defaultHomeProfile.city &&
    state === defaultHomeProfile.state &&
    postalCode === defaultHomeProfile.postalCode &&
    entryMethod === defaultHomeProfile.entryMethod &&
    entryNotes === (defaultHomeProfile.entryNotes ?? "");

  function toggleRoomType(value: RoomType) {
    setRoomTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function goNext() {
    if (step === 0 && (!addressLine1 || !city || !state || !postalCode)) {
      return;
    }

    if (step === 1 && roomTypes.length === 0) {
      return;
    }

    if (step === 2 && timingPreference === TimingPreference.TIME_SLOT && !requestedDate) {
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (step < steps.length - 1) {
      event.preventDefault();
    }
  }

  return (
    <form
      action="/customer/jobs/create"
      method="post"
      className="market-form stack"
      onSubmit={handleSubmit}
    >
      <div className="market-wizard-progress">
        {steps.map((label, index) => (
          <div
            key={label}
            className={index === step ? "market-wizard-progress__step active" : "market-wizard-progress__step"}
          >
            <span>{index + 1}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>

      {step === 0 ? (
        <section className="market-form-section stack">
          <div className="market-section-heading">
            <h2>Choose your home</h2>
          </div>
          {defaultHomeProfile ? (
            <div className="market-preset-card">
              <div className="stack small">
                <strong>Using {defaultHomeProfile.label}</strong>
                <span className="market-card__meta">
                  {defaultHomeProfile.addressLine1}, {defaultHomeProfile.city}, {defaultHomeProfile.state} {defaultHomeProfile.postalCode}
                </span>
              </div>
              <Link href="/customer/my-home" className="market-text-link">
                Edit My Home
              </Link>
            </div>
          ) : (
            <div className="notice">
              Save your address and entry details once in <Link href="/customer/my-home">My Home</Link> to post faster next time.
            </div>
          )}
          <div className="field">
            <label htmlFor="addressLine1">Street address</label>
            <input id="addressLine1" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="addressLine2">Apartment or suite</label>
            <input id="addressLine2" value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} />
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" value={city} onChange={(event) => setCity(event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="state">State</label>
              <input id="state" value={state} onChange={(event) => setState(event.target.value)} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="postalCode">ZIP code</label>
            <input id="postalCode" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} required />
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="market-form-section stack">
          <div className="market-section-heading">
            <h2>Pick the rooms and level of clean</h2>
          </div>
          <div className="market-room-grid">
            {roomTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={roomTypes.includes(option.value) ? "market-room-card active" : "market-room-card"}
                onClick={() => toggleRoomType(option.value)}
              >
                <span className="market-room-card__icon">{option.icon}</span>
                <strong>{option.label}</strong>
              </button>
            ))}
          </div>
          <div className="field">
            <label>Level of clean</label>
            <div className="market-segmented market-segmented--triple">
              {cleanLevelOptions.map((option) => (
                <label
                  key={option.value}
                  className={cleanLevel === option.value ? "market-segmented__option active" : "market-segmented__option"}
                >
                  <input
                    type="radio"
                    value={option.value}
                    checked={cleanLevel === option.value}
                    onChange={() => setCleanLevel(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="market-form-section stack">
          <div className="market-section-heading">
            <h2>Pick the time and how I’ll let you in</h2>
          </div>
          <div className="market-segmented">
            <label className={timingPreference === TimingPreference.ASAP ? "market-segmented__option active" : "market-segmented__option"}>
              <input
                type="radio"
                value={TimingPreference.ASAP}
                checked={timingPreference === TimingPreference.ASAP}
                onChange={() => setTimingPreference(TimingPreference.ASAP)}
              />
              ASAP
            </label>
            <label className={timingPreference === TimingPreference.TIME_SLOT ? "market-segmented__option active" : "market-segmented__option"}>
              <input
                type="radio"
                value={TimingPreference.TIME_SLOT}
                checked={timingPreference === TimingPreference.TIME_SLOT}
                onChange={() => setTimingPreference(TimingPreference.TIME_SLOT)}
              />
              Pick a Time
            </label>
          </div>

          {timingPreference === TimingPreference.TIME_SLOT ? (
            <div className="stack">
              <div className="field">
                <label htmlFor="requestedDate">Date</label>
                <input
                  id="requestedDate"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={requestedDate}
                  onChange={(event) => setRequestedDate(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="requestedWindowStart">Arrival window</label>
                <select
                  id="requestedWindowStart"
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
            </div>
          ) : (
            <div className="market-empty">
              <strong>ASAP request</strong>
              <p className="market-card__copy">
                Pros will bid with how soon they can arrive instead of choosing a fixed slot.
              </p>
            </div>
          )}

          <div className="field">
            <label htmlFor="entryMethod">How I’ll let you in</label>
            <select
              id="entryMethod"
              value={entryMethod}
              onChange={(event) => setEntryMethod(event.target.value as EntryMethod)}
            >
              {entryMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="entryNotes">Entry details</label>
            <textarea
              id="entryNotes"
              value={entryNotes}
              onChange={(event) => setEntryNotes(event.target.value)}
              placeholder="Door code, hidden key spot, or call box instructions."
            />
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="market-form-section stack">
          <div className="market-section-heading">
            <h2>Review</h2>
          </div>

          <article className="market-card">
            <div className="stack small">
              <strong>{addressLine1}, {city}, {state} {postalCode}</strong>
              <span className="market-card__meta">{formatRoomTypesLocal(roomTypes)}</span>
              <span className="market-card__meta">{cleanLevelOptions.find((option) => option.value === cleanLevel)?.label ?? "Medium Clean"}</span>
              <span className="market-card__meta">{entryMethodOptions.find((option) => option.value === entryMethod)?.label ?? entryMethod}</span>
              <span className="market-card__meta">
                {timingPreference === TimingPreference.ASAP
                  ? "ASAP request"
                  : `${requestedDate || "Choose a date"} · ${selectedWindow?.label ?? "Choose a window"}`}
              </span>
            </div>
          </article>

          <div className="field">
            <label htmlFor="notes">Anything specific?</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Pets, parking, or specific areas to focus on."
            />
          </div>

          <div className="notice">
            No charge during testing. In production, accepting a bid places a temporary authorization hold.
          </div>
        </section>
      ) : null}

      <input type="hidden" name="homeProfileId" value={isUsingPreset ? defaultHomeProfile?.id ?? "" : ""} />
      <input type="hidden" name="addressLine1" value={addressLine1} />
      <input type="hidden" name="addressLine2" value={addressLine2} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="postalCode" value={postalCode} />
      <input type="hidden" name="entryMethod" value={entryMethod} />
      <input type="hidden" name="entryNotes" value={entryNotes} />
      <input type="hidden" name="cleanLevel" value={cleanLevel} />
      <input type="hidden" name="timingPreference" value={timingPreference} />
      <input type="hidden" name="requestedDate" value={requestedDate} />
      <input type="hidden" name="requestedWindowStart" value={windowStart} />
      <input type="hidden" name="requestedWindowEnd" value={selectedWindow?.end ?? ""} />
      <input type="hidden" name="notes" value={notes} />
      {roomTypes.map((roomType) => (
        <input key={roomType} type="hidden" name="roomTypes" value={roomType} />
      ))}
      {serviceNeeds.map((serviceNeed) => (
        <input key={serviceNeed} type="hidden" name="serviceNeeds" value={serviceNeed} />
      ))}

      <div className="market-wizard-actions">
        {step > 0 ? (
          <button type="button" className="secondary-submit" onClick={goBack}>
            Back
          </button>
        ) : null}
        {step < steps.length - 1 ? (
          <button type="button" onClick={goNext}>
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={
              timingPreference === TimingPreference.TIME_SLOT &&
              (!requestedDate || !selectedWindow)
            }
          >
            Post Job
          </button>
        )}
      </div>
    </form>
  );
}

function deriveServiceNeeds(roomTypes: RoomType[], cleanLevel: CleanLevel) {
  const needs = new Set<ServiceNeed>([ServiceNeed.GENERAL_CLEANING]);

  for (const roomType of roomTypes) {
    if (roomType === RoomType.KITCHEN) {
      needs.add(ServiceNeed.KITCHEN);
    }

    if (roomType === RoomType.BATHROOM) {
      needs.add(ServiceNeed.BATHROOMS);
    }

    if (roomType === RoomType.LAUNDRY) {
      needs.add(ServiceNeed.LAUNDRY);
    }
  }

  if (cleanLevel === CleanLevel.DEEP) {
    needs.add(ServiceNeed.DEEP_CLEAN);
  }

  if (cleanLevel !== CleanLevel.LIGHT) {
    needs.add(ServiceNeed.FLOORS);
    needs.add(ServiceNeed.DUSTING);
  }

  return Array.from(needs);
}

function formatRoomTypesLocal(roomTypes: RoomType[]) {
  return roomTypes
    .map((roomType) => roomTypeOptions.find((option) => option.value === roomType)?.label ?? roomType)
    .join(", ");
}
