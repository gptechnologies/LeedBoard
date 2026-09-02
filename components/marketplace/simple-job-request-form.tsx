"use client";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Home,
  LoaderCircle,
  MapPin,
  Pencil,
  Sparkles,
} from "lucide-react";
import { CleanLevel, EntryMethod, ServiceNeed, TimingPreference } from "@prisma/client";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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
type CleaningChoice = "standard" | "deep" | "move_out";
type Direction = "forward" | "back";
type Stage = 1 | 2 | 3 | 4;

const emptyAddress: AddressState = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "New York",
  postalCode: "",
};

const cleaningOptions: Array<{
  value: CleaningChoice;
  label: string;
  description: string;
  cleanLevel: CleanLevel;
  serviceNeeds: ServiceNeed[];
}> = [
  {
    value: "standard",
    label: "Standard clean",
    description: "A regular whole-home reset",
    cleanLevel: CleanLevel.MEDIUM,
    serviceNeeds: [ServiceNeed.GENERAL_CLEANING],
  },
  {
    value: "deep",
    label: "Deep clean",
    description: "Extra attention for buildup and details",
    cleanLevel: CleanLevel.DEEP,
    serviceNeeds: [ServiceNeed.GENERAL_CLEANING, ServiceNeed.DEEP_CLEAN],
  },
  {
    value: "move_out",
    label: "Move-in or move-out",
    description: "A thorough clean for an empty home",
    cleanLevel: CleanLevel.DEEP,
    serviceNeeds: [ServiceNeed.MOVE_OUT, ServiceNeed.DEEP_CLEAN],
  },
];

export function SimpleJobRequestForm({ homeProfiles }: { homeProfiles: HomeChoice[] }) {
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState<Stage>(1);
  const [direction, setDirection] = useState<Direction>("forward");
  const [locationMode, setLocationMode] = useState<LocationMode>(homeProfiles.length ? "saved" : "manual");
  const [selectedHomeId, setSelectedHomeId] = useState(homeProfiles[0]?.id ?? "");
  const [address, setAddress] = useState<AddressState>(emptyAddress);
  const [saveHome, setSaveHome] = useState(false);
  const [dateChoice, setDateChoice] = useState<DateChoice | "">("");
  const [customDate, setCustomDate] = useState("");
  const [time, setTime] = useState("");
  const [cleaningChoice, setCleaningChoice] = useState<CleaningChoice | "">("");
  const [notes, setNotes] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const [createdJobId, setCreatedJobId] = useState("");
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const wizardCardRef = useRef<HTMLDivElement>(null);

  const selectedHome = homeProfiles.find((home) => home.id === selectedHomeId) ?? null;
  const selectedCleaning = cleaningOptions.find((option) => option.value === cleaningChoice) ?? null;
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
  const detailsComplete = Boolean(selectedCleaning);
  const timeEnd = time ? addHours(time, 2) : "";

  useEffect(() => {
    if (!started) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      wizardCardRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      questionHeadingRef.current?.focus({ preventScroll: true });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [stage, started]);

  function begin() {
    setStarted(true);
    setDirection("forward");
    triggerHaptic("light");
  }

  function goTo(nextStage: Stage) {
    setDirection(nextStage > stage ? "forward" : "back");
    setStage(nextStage);
    setSubmitError("");
    triggerHaptic("light");
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
    if (stage !== 4 || !locationComplete || !scheduleComplete || !detailsComplete || submitState !== "idle") return;

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

  if (!started) {
    return (
      <section className="wk-job-launch-card" aria-labelledby="job-launch-title">
        <div className="wk-job-launch-art" aria-hidden="true">
          <span className="wk-job-launch-orbit"><Sparkles /></span>
          <span className="wk-job-launch-home"><Home /></span>
          <i /><i /><i />
        </div>
        <div className="wk-job-launch-copy">
          <span>Ready when you are</span>
          <h2 id="job-launch-title">Let’s get your home cleaned</h2>
          <p>Four quick steps. Nearby cleaners will send you their prices.</p>
        </div>
        <button className="wk-job-launch-button wk-pressable" onClick={begin} type="button">
          Create a cleaning job <ChevronRight aria-hidden="true" />
        </button>
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
      <input type="hidden" name="cleanLevel" value={selectedCleaning?.cleanLevel ?? CleanLevel.MEDIUM} />
      {(selectedCleaning?.serviceNeeds ?? [ServiceNeed.GENERAL_CLEANING]).map((need) => (
        <input key={need} type="hidden" name="serviceNeeds" value={need} />
      ))}
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="saveHome" value={locationMode === "manual" && saveHome ? "true" : "false"} />
      <input type="hidden" name="timingPreference" value={flexible ? TimingPreference.ASAP : TimingPreference.TIME_SLOT} />
      {!flexible ? (
        <>
          <input type="hidden" name="requestedDate" value={requestedDate} />
          <input type="hidden" name="requestedWindowStart" value={time} />
          <input type="hidden" name="requestedWindowEnd" value={timeEnd} />
        </>
      ) : null}

      <div className="wk-wizard-card" ref={wizardCardRef}>
        <div className="wk-progress" aria-label={`Step ${stage} of 4`}>
          <span>{String(stage).padStart(2, "0")} / 04</span>
          <i><b style={{ width: `${stage * 25}%` }} /></i>
        </div>

        <div className={`wk-question-card is-${direction}`} key={stage}>
          {stage === 1 ? (
            <section className="wk-form-section">
              <QuestionHeading eyebrow="Address" headingRef={questionHeadingRef}>Where should the cleaner arrive?</QuestionHeading>

              {homeProfiles.length ? (
                <div className="wk-location-toggle" role="group" aria-label="Choose an address source">
                  <button aria-pressed={locationMode === "saved"} className={`wk-pressable${locationMode === "saved" ? " is-selected" : ""}`} onClick={() => chooseLocationMode("saved")} type="button">
                    <Home aria-hidden="true" /> Saved home
                  </button>
                  <button aria-pressed={locationMode === "manual"} className={`wk-pressable${locationMode === "manual" ? " is-selected" : ""}`} onClick={() => chooseLocationMode("manual")} type="button">
                    <MapPin aria-hidden="true" /> New address
                  </button>
                </div>
              ) : null}

              {locationMode === "saved" && homeProfiles.length ? (
                <div className="wk-home-choice-list" role="radiogroup" aria-label="Saved homes">
                  {homeProfiles.map((home) => (
                    <button
                      aria-checked={selectedHomeId === home.id}
                      className={`wk-home-choice wk-pressable${selectedHomeId === home.id ? " is-selected" : ""}`}
                      key={home.id}
                      onClick={() => { setSelectedHomeId(home.id); triggerHaptic("selection"); }}
                      role="radio"
                      type="button"
                    >
                      <MapPin aria-hidden="true" />
                      <span><strong>{home.label}</strong><small>{home.addressLine1}, {home.city}</small></span>
                      <span className="wk-choice-check" aria-hidden="true">{selectedHomeId === home.id ? <Check /> : null}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="wk-address-fields">
                  <label><span>Street address</span><input autoComplete="street-address" onChange={(event) => updateAddress("addressLine1", event.target.value)} value={address.addressLine1} /></label>
                  <label><span>Apartment or suite <small>Optional</small></span><input autoComplete="address-line2" onChange={(event) => updateAddress("addressLine2", event.target.value)} value={address.addressLine2} /></label>
                  <div>
                    <label><span>City</span><input autoComplete="address-level2" onChange={(event) => updateAddress("city", event.target.value)} value={address.city} /></label>
                    <label><span>State</span><input autoComplete="address-level1" maxLength={32} onChange={(event) => updateAddress("state", event.target.value)} value={address.state} /></label>
                  </div>
                  <label><span>ZIP code</span><input autoComplete="postal-code" inputMode="numeric" onChange={(event) => updateAddress("postalCode", event.target.value)} value={address.postalCode} /></label>
                  <label className="wk-flex-toggle wk-pressable">
                    <span>Save this home for next time</span>
                    <input checked={saveHome} onChange={(event) => { setSaveHome(event.target.checked); triggerHaptic("selection"); }} type="checkbox" />
                    <i aria-hidden="true" />
                  </label>
                </div>
              )}
              <WizardActions canContinue={locationComplete} nextLabel="Choose a time" onBack={() => setStarted(false)} onNext={() => goTo(2)} />
            </section>
          ) : null}

          {stage === 2 ? (
            <section className="wk-form-section">
              <QuestionHeading eyebrow="Date & time" headingRef={questionHeadingRef}>When would you like it cleaned?</QuestionHeading>
              <div className="wk-date-shortcuts" role="group" aria-label="Choose a day">
                {([[
                  "today", "Today",
                ], ["tomorrow", "Tomorrow"], ["pick", "Pick a date"], ["flexible", "I’m flexible"]] as const).map(([value, label]) => (
                  <button aria-pressed={dateChoice === value} className={`wk-pressable${dateChoice === value ? " is-selected" : ""}`} key={value} onClick={() => chooseDate(value)} type="button">
                    {value === "pick" ? <CalendarDays aria-hidden="true" /> : null}{label}
                  </button>
                ))}
              </div>
              {dateChoice === "pick" ? (
                <label className="wk-schedule-input">
                  <CalendarDays aria-hidden="true" />
                  <span><strong>Cleaning date</strong><small>{customDate ? formatDate(customDate) : "Choose a date"}</small></span>
                  <input aria-label="Requested date" min={getLocalDate(0)} onChange={(event) => { setCustomDate(event.target.value); if (event.target.value) triggerHaptic("selection"); }} type="date" value={customDate} />
                </label>
              ) : null}
              {dateChoice && !flexible ? (
                <label className="wk-schedule-input">
                  <Clock3 aria-hidden="true" />
                  <span><strong>Arrival time</strong><small>{time ? `${formatTime(time)}–${formatTime(timeEnd)}` : "Choose a two-hour window"}</small></span>
                  <input aria-label="Requested time" onChange={(event) => { setTime(event.target.value); if (event.target.value) triggerHaptic("selection"); }} type="time" value={time} />
                </label>
              ) : null}
              {flexible ? <p className="wk-form-guidance">Cleaners can suggest the soonest time that works.</p> : null}
              <WizardActions canContinue={scheduleComplete} nextLabel="Add details" onBack={() => goTo(1)} onNext={() => goTo(3)} />
            </section>
          ) : null}

          {stage === 3 ? (
            <section className="wk-form-section">
              <QuestionHeading eyebrow="Details & note" headingRef={questionHeadingRef}>What kind of clean do you need?</QuestionHeading>
              <div className="wk-cleaning-choice-list" role="radiogroup" aria-label="Cleaning type">
                {cleaningOptions.map((option) => (
                  <button
                    aria-checked={cleaningChoice === option.value}
                    className={`wk-cleaning-choice wk-pressable${cleaningChoice === option.value ? " is-selected" : ""}`}
                    key={option.value}
                    onClick={() => { setCleaningChoice(option.value); triggerHaptic("selection"); }}
                    role="radio"
                    type="button"
                  >
                    <span><strong>{option.label}</strong><small>{option.description}</small></span>
                    <span className="wk-choice-check" aria-hidden="true">{cleaningChoice === option.value ? <Check /> : null}</span>
                  </button>
                ))}
              </div>
              <label className="wk-textarea-field">
                <span>Anything else we should know? <small>Optional</small></span>
                <textarea onChange={(event) => setNotes(event.target.value)} placeholder="Rooms to prioritize, pets, parking, or access details" value={notes} />
              </label>
              <WizardActions canContinue={detailsComplete} nextLabel="Review job" onBack={() => goTo(2)} onNext={() => goTo(4)} />
            </section>
          ) : null}

          {stage === 4 ? (
            <section className="wk-form-section">
              <QuestionHeading eyebrow="Summary" headingRef={questionHeadingRef}>Ready to post your job?</QuestionHeading>
              <div className="wk-job-summary">
                <SummaryRow icon={<MapPin />} label="Address" onEdit={() => goTo(1)} value={formatAddress(activeAddress)} />
                <SummaryRow icon={<CalendarDays />} label="When" onEdit={() => goTo(2)} value={flexible ? "Flexible — soonest available" : `${formatDate(requestedDate)} · ${formatTime(time)}–${formatTime(timeEnd)}`} />
                <SummaryRow icon={<Sparkles />} label="Cleaning" onEdit={() => goTo(3)} value={selectedCleaning?.label ?? ""} />
                {notes ? <div className="wk-summary-note"><span>Your note</span><p>{notes}</p></div> : null}
              </div>
              {submitError ? <p className="wk-form-error" role="alert">{submitError}</p> : null}
              <div className="wk-final-actions">
                <button aria-label="Back to details" className="wk-step-back wk-pressable" onClick={() => goTo(3)} type="button"><ArrowLeft aria-hidden="true" /></button>
                <button aria-busy={submitState === "posting"} className={`wk-primary-action wk-pressable${submitState === "posting" ? " is-posting" : ""}`} disabled={submitState === "posting"} type="submit">
                  {submitState === "posting" ? <><LoaderCircle className="wk-button-spinner" aria-hidden="true" /> Posting job</> : <>Post cleaning job <ChevronRight aria-hidden="true" /></>}
                </button>
              </div>
              <p className="wk-post-reassurance">No payment today. You choose a cleaner after reviewing prices.</p>
            </section>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function QuestionHeading({ children, eyebrow, headingRef }: { children: string; eyebrow: string; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <div className="wk-question-heading">
      <span>{eyebrow}</span>
      <h2 ref={headingRef} tabIndex={-1}>{children}</h2>
    </div>
  );
}

function WizardActions({ canContinue, nextLabel, onBack, onNext }: { canContinue: boolean; nextLabel: string; onBack: () => void; onNext: () => void }) {
  return (
    <div className="wk-step-actions">
      <button aria-label="Go back" className="wk-step-back wk-pressable" onClick={onBack} type="button"><ArrowLeft aria-hidden="true" /></button>
      <button className="wk-step-continue wk-primary-action wk-pressable" disabled={!canContinue} onClick={onNext} type="button">
        {nextLabel} <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}

function SummaryRow({ icon, label, onEdit, value }: { icon: React.ReactNode; label: string; onEdit: () => void; value: string }) {
  return (
    <div className="wk-summary-row">
      <span className="wk-summary-row__icon" aria-hidden="true">{icon}</span>
      <span><small>{label}</small><strong>{value}</strong></span>
      <button aria-label={`Edit ${label.toLowerCase()}`} className="wk-pressable" onClick={onEdit} type="button"><Pencil aria-hidden="true" /></button>
    </div>
  );
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

function formatAddress(address: AddressState) {
  return [address.addressLine1, address.addressLine2, `${address.city}, ${address.state} ${address.postalCode}`].filter(Boolean).join(", ");
}
