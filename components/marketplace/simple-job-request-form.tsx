"use client";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Home,
  LoaderCircle,
  MapPin,
  Sparkles,
} from "lucide-react";
import { CleanLevel, EntryMethod, ServiceNeed, TimingPreference } from "@prisma/client";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { triggerHaptic } from "@/lib/haptics";

type HomeChoice = {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  entryMethod: EntryMethod;
  entryNotes: string | null;
};

type AddressState = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

type SubmitState = "idle" | "posting" | "success";
type LocationMode = "saved" | "manual";
type DateChoice = "today" | "tomorrow" | "pick" | "flexible";

const emptyAddress: AddressState = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "New York",
  postalCode: "",
};

export function SimpleJobRequestForm({ homeProfiles }: { homeProfiles: HomeChoice[] }) {
  const [locationMode, setLocationMode] = useState<LocationMode>(homeProfiles.length ? "saved" : "manual");
  const [selectedHomeId, setSelectedHomeId] = useState(homeProfiles[0]?.id ?? "");
  const [address, setAddress] = useState<AddressState>(emptyAddress);
  const [saveHome, setSaveHome] = useState(false);
  const [dateChoice, setDateChoice] = useState<DateChoice | "">("");
  const [customDate, setCustomDate] = useState("");
  const [time, setTime] = useState("");
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const [createdJobId, setCreatedJobId] = useState("");

  const selectedHome = homeProfiles.find((home) => home.id === selectedHomeId) ?? null;
  const activeAddress = locationMode === "saved" && selectedHome
    ? {
        addressLine1: selectedHome.addressLine1,
        addressLine2: selectedHome.addressLine2 ?? "",
        city: selectedHome.city,
        state: selectedHome.state,
        postalCode: selectedHome.postalCode,
      }
    : address;
  const locationComplete = locationMode === "saved"
    ? Boolean(selectedHome)
    : Boolean(address.addressLine1.trim() && address.city.trim() && address.state.trim() && address.postalCode.trim());
  const flexible = dateChoice === "flexible";
  const requestedDate = useMemo(() => getRequestedDate(dateChoice, customDate), [customDate, dateChoice]);
  const scheduleComplete = flexible || Boolean(requestedDate && time);
  const detailsRevealed = stage === 3 && locationComplete && scheduleComplete;
  const canPost = detailsRevealed && submitState === "idle";
  const timeEnd = time ? addHours(time, 2) : "";

  function continueTo(nextStage: 2 | 3) {
    setStage(nextStage);
    triggerHaptic("light");
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function chooseLocationMode(mode: LocationMode) {
    setLocationMode(mode);
    setSubmitError("");
    triggerHaptic("selection");
  }

  function chooseDate(choice: DateChoice) {
    setDateChoice(choice);
    if (choice !== "pick") setCustomDate("");
    triggerHaptic("selection");
  }

  function updateAddress(field: keyof AddressState, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    setSubmitError("");
  }

  async function postJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPost) return;

    setSubmitError("");
    setSubmitState("posting");

    try {
      const response = await fetch(event.currentTarget.action, {
        method: "POST",
        body: new FormData(event.currentTarget),
        headers: { "X-Well-Kept-Client": "1" },
      });
      const result = (await response.json()) as { error?: string; jobId?: string };

      if (!response.ok || !result.jobId) {
        throw new Error(result.error || "We couldn’t post your request. Check your connection and try again.");
      }

      setCreatedJobId(result.jobId);
      setSubmitState("success");
      triggerHaptic("success");
    } catch (error) {
      setSubmitState("idle");
      setSubmitError(error instanceof Error ? error.message : "We couldn’t post your request. Try again.");
      triggerHaptic("warning");
    }
  }

  if (submitState === "success") {
    return (
      <section className="wk-post-success" aria-live="polite">
        <div className="wk-post-success__mark" aria-hidden="true"><Check /></div>
        <div>
          <p>Request posted</p>
          <h2>Your request is live</h2>
          <span>Nearby cleaners can review it now. We’ll email you when a bid arrives.</span>
        </div>
        <Link className="wk-primary-action wk-pressable" href={`/customer/jobs/${createdJobId}`}>
          View job <ChevronRight aria-hidden="true" />
        </Link>
        <Link className="wk-text-action wk-pressable" href={`/customer/jobs/${createdJobId}/priority`}>
          Improve cleaner matching
        </Link>
      </section>
    );
  }

  return (
    <form action="/customer/jobs/create" className="wk-job-form" method="post" onSubmit={postJob}>
      <input type="hidden" name="title" value="Home Cleaning" />
      <input type="hidden" name="homeProfileId" value={locationMode === "saved" ? selectedHome?.id ?? "" : ""} />
      <input type="hidden" name="addressLine1" value={activeAddress.addressLine1} />
      <input type="hidden" name="addressLine2" value={activeAddress.addressLine2} />
      <input type="hidden" name="city" value={activeAddress.city} />
      <input type="hidden" name="state" value={activeAddress.state} />
      <input type="hidden" name="postalCode" value={activeAddress.postalCode} />
      <input type="hidden" name="entryMethod" value={locationMode === "saved" ? selectedHome?.entryMethod ?? EntryMethod.I_WILL_BE_HOME : EntryMethod.I_WILL_BE_HOME} />
      <input type="hidden" name="entryNotes" value={locationMode === "saved" ? selectedHome?.entryNotes ?? "" : ""} />
      <input type="hidden" name="cleanLevel" value={CleanLevel.MEDIUM} />
      <input type="hidden" name="serviceNeeds" value={ServiceNeed.GENERAL_CLEANING} />
      <input type="hidden" name="saveHome" value={locationMode === "manual" && saveHome ? "true" : "false"} />
      <input type="hidden" name="timingPreference" value={flexible ? TimingPreference.ASAP : TimingPreference.TIME_SLOT} />
      {!flexible ? (
        <>
          <input type="hidden" name="requestedDate" value={requestedDate} />
          <input type="hidden" name="requestedWindowStart" value={time} />
          <input type="hidden" name="requestedWindowEnd" value={timeEnd} />
        </>
      ) : null}

      <div className="wk-progress" aria-label={`Step ${stage} of 3`}>
        <span>Step {stage} of 3</span>
        <i><b style={{ width: `${stage * 33.333}%` }} /></i>
      </div>

      {stage === 1 ? <section className={`wk-form-section${locationComplete ? " is-complete" : ""}`}>
        <div className="wk-cleaning-context">
          <span><Sparkles aria-hidden="true" /></span>
          <div><small>Service</small><strong>Home cleaning</strong></div>
        </div>
        <SectionHeading complete={locationComplete}>Where should the cleaner arrive?</SectionHeading>

        {homeProfiles.length ? (
          <div className="wk-location-toggle" role="group" aria-label="Choose an address source">
            <button aria-pressed={locationMode === "saved"} className={`wk-pressable${locationMode === "saved" ? " is-selected" : ""}`} onClick={() => chooseLocationMode("saved")} type="button">
              <Home aria-hidden="true" /> Saved home
            </button>
            <button aria-pressed={locationMode === "manual"} className={`wk-pressable${locationMode === "manual" ? " is-selected" : ""}`} onClick={() => chooseLocationMode("manual")} type="button">
              <MapPin aria-hidden="true" /> Another address
            </button>
          </div>
        ) : (
          <p className="wk-form-guidance">Enter the job address. Saving it for next time is optional.</p>
        )}

        {locationMode === "saved" && homeProfiles.length ? (
          <div className="wk-home-choice-list" role="radiogroup" aria-label="Saved homes">
            {homeProfiles.map((home) => (
              <button
                aria-checked={selectedHomeId === home.id}
                className={`wk-home-choice wk-pressable${selectedHomeId === home.id ? " is-selected" : ""}`}
                key={home.id}
                onClick={() => {
                  setSelectedHomeId(home.id);
                  triggerHaptic("selection");
                }}
                role="radio"
                type="button"
              >
                <MapPin aria-hidden="true" />
                <span><strong>{home.label}</strong><small>{home.addressLine1}, {home.city}</small></span>
                {selectedHomeId === home.id ? <CheckCircle2 aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="wk-address-fields">
            <label><span>Street address</span><input autoComplete="street-address" onChange={(event) => updateAddress("addressLine1", event.target.value)} required value={address.addressLine1} /></label>
            <label><span>Apartment or suite <small>Optional</small></span><input autoComplete="address-line2" onChange={(event) => updateAddress("addressLine2", event.target.value)} value={address.addressLine2} /></label>
            <div>
              <label><span>City</span><input autoComplete="address-level2" onChange={(event) => updateAddress("city", event.target.value)} required value={address.city} /></label>
              <label><span>State</span><input autoComplete="address-level1" maxLength={32} onChange={(event) => updateAddress("state", event.target.value)} required value={address.state} /></label>
            </div>
            <label><span>ZIP code</span><input autoComplete="postal-code" inputMode="numeric" onChange={(event) => updateAddress("postalCode", event.target.value)} required value={address.postalCode} /></label>
            <label className="wk-flex-toggle wk-pressable">
              <span>Save this home for next time</span>
              <input checked={saveHome} onChange={(event) => { setSaveHome(event.target.checked); triggerHaptic("selection"); }} type="checkbox" />
              <i aria-hidden="true" />
            </label>
          </div>
        )}
        <button className="wk-step-continue wk-primary-action wk-pressable" disabled={!locationComplete} onClick={() => continueTo(2)} type="button">
          Continue to schedule <ChevronRight aria-hidden="true" />
        </button>
      </section> : null}

      {stage === 2 ? (
        <section className={`wk-form-section wk-progressive-section${scheduleComplete ? " is-complete" : ""}`}>
          <SectionHeading complete={scheduleComplete}>When do you need it?</SectionHeading>
          <div className="wk-date-shortcuts" role="group" aria-label="Choose a day">
            {([
              ["today", "Today"],
              ["tomorrow", "Tomorrow"],
              ["pick", "Pick a date"],
              ["flexible", "Flexible"],
            ] as const).map(([value, label]) => (
              <button aria-pressed={dateChoice === value} className={`wk-pressable${dateChoice === value ? " is-selected" : ""}`} key={value} onClick={() => chooseDate(value)} type="button">
                {value === "pick" ? <CalendarDays aria-hidden="true" /> : null}{label}
              </button>
            ))}
          </div>
          {dateChoice === "pick" ? (
            <label className="wk-schedule-input">
              <CalendarDays aria-hidden="true" />
              <span><strong>Date</strong><small>{customDate ? formatDate(customDate) : "Choose a date"}</small></span>
              <input aria-label="Requested date" min={getLocalDate(0)} onChange={(event) => { setCustomDate(event.target.value); if (event.target.value) triggerHaptic("selection"); }} type="date" value={customDate} />
            </label>
          ) : null}
          {dateChoice && !flexible ? (
            <label className="wk-schedule-input">
              <Clock3 aria-hidden="true" />
              <span><strong>Arrival time</strong><small>{time ? `${formatTime(time)} to ${formatTime(timeEnd)}` : "Choose a two-hour window"}</small></span>
              <input aria-label="Requested time" onChange={(event) => { setTime(event.target.value); if (event.target.value) triggerHaptic("selection"); }} type="time" value={time} />
            </label>
          ) : null}
          {flexible ? <p className="wk-form-guidance">Cleaners can propose the soonest time that works.</p> : null}
          <div className="wk-step-actions">
            <button className="wk-step-back wk-pressable" onClick={() => setStage(1)} type="button">Back</button>
            <button className="wk-step-continue wk-primary-action wk-pressable" disabled={!scheduleComplete} onClick={() => continueTo(3)} type="button">
              Continue to review <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : null}

      {detailsRevealed ? (
        <section className="wk-form-section wk-progressive-section">
          <SectionHeading>Review your request</SectionHeading>
          <p className="wk-form-guidance">Check the address and timing before posting. Cleaners will send their own prices.</p>
          <button className="wk-step-back wk-pressable" onClick={() => setStage(2)} type="button">Edit schedule</button>
          <label className="wk-textarea-field">
            <span>Anything the cleaner should know? <small>Optional</small></span>
            <textarea name="notes" placeholder="Rooms to prioritize, parking, products, pets, or access details." />
          </label>
          <div className="wk-saved-home"><Check aria-hidden="true" /><span><strong>{locationMode === "saved" ? selectedHome?.label : saveHome ? "New saved home" : "One-time address"}</strong><small>{activeAddress.addressLine1}, {activeAddress.city}</small></span></div>
        </section>
      ) : null}

      {detailsRevealed ? (
        <div className="wk-post-action wk-progressive-section">
          {submitError ? <p className="wk-form-error" role="alert">{submitError}</p> : null}
          <button aria-busy={submitState === "posting"} className={`wk-primary-action wk-pressable${submitState === "posting" ? " is-posting" : ""}`} disabled={!canPost} type="submit">
            {submitState === "posting" ? <><LoaderCircle className="wk-button-spinner" aria-hidden="true" /> Posting job</> : <>Post cleaning job <ChevronRight aria-hidden="true" /></>}
          </button>
        </div>
      ) : null}
    </form>
  );
}

function SectionHeading({ children, complete = false }: { children: string; complete?: boolean }) {
  return <div className="wk-form-section__heading"><h2>{children}</h2>{complete ? <CheckCircle2 aria-label="Complete" /> : null}</div>;
}

function getRequestedDate(choice: DateChoice | "", customDate: string) {
  if (choice === "today") return getLocalDate(0);
  if (choice === "tomorrow") return getLocalDate(1);
  if (choice === "pick") return customDate;
  return "";
}

function getLocalDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addHours(time: string, amount: number) {
  const [hours, minutes] = time.split(":").map(Number);
  return `${String((hours + amount) % 24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(time: string) {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
