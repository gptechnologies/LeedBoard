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
import {
  BidSelectionPriority,
  CleanLevel,
  EntryMethod,
  HomeCondition,
  JobCleanType,
  JobPriorityArea,
  ServiceNeed,
  SuppliesSource,
  TimingPreference,
} from "@prisma/client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { triggerHaptic } from "@/lib/haptics";
import { entryMethodOptions, suppliesSourceOptions } from "@/lib/marketplace-constants";

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
  suppliesSource: SuppliesSource;
};

type AddressState = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

type SubmitState = "idle" | "posting";
type LocationMode = "saved" | "manual";
type DateChoice = "today" | "tomorrow" | "pick" | "soonest";
type CleaningChoice = "standard" | "deep" | "move_out";
type Direction = "forward" | "back";
type Stage = 1 | 2 | 3 | 4 | 5;

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
  cleanType: JobCleanType;
  serviceNeeds: ServiceNeed[];
}> = [
  {
    value: "standard",
    label: "Standard clean",
    description: "A regular whole-home reset",
    cleanLevel: CleanLevel.MEDIUM,
    cleanType: JobCleanType.STANDARD_CLEAN,
    serviceNeeds: [ServiceNeed.GENERAL_CLEANING],
  },
  {
    value: "deep",
    label: "Deep clean",
    description: "Extra attention for buildup and details",
    cleanLevel: CleanLevel.DEEP,
    cleanType: JobCleanType.DEEP_CLEAN,
    serviceNeeds: [ServiceNeed.GENERAL_CLEANING, ServiceNeed.DEEP_CLEAN],
  },
  {
    value: "move_out",
    label: "Move-in or move-out",
    description: "A thorough clean for an empty home",
    cleanLevel: CleanLevel.DEEP,
    cleanType: JobCleanType.MOVE_OUT_CLEAN,
    serviceNeeds: [ServiceNeed.MOVE_OUT, ServiceNeed.DEEP_CLEAN],
  },
];

const conditionOptions = [
  { value: HomeCondition.LIGHT_TOUCH_UP, label: "Light touch-up", description: "Mostly tidy with light dust or maintenance cleaning" },
  { value: HomeCondition.NORMAL_LIVED_IN, label: "Normally lived-in", description: "Typical weekly buildup in an occupied home" },
  { value: HomeCondition.NEEDS_EXTRA_ATTENTION, label: "Needs extra attention", description: "Heavier buildup or several areas that need more time" },
] as const;

const priorityAreaOptions = [
  { value: JobPriorityArea.KITCHEN, label: "Kitchen" },
  { value: JobPriorityArea.BATHROOMS, label: "Bathrooms" },
  { value: JobPriorityArea.FLOORS, label: "Floors" },
  { value: JobPriorityArea.PET_HAIR, label: "Pet hair" },
  { value: JobPriorityArea.INSIDE_FRIDGE, label: "Inside fridge" },
  { value: JobPriorityArea.INSIDE_OVEN, label: "Inside oven" },
] as const;

const selectionPriorityOptions = [
  { value: BidSelectionPriority.BEST_OVERALL, label: "Best overall" },
  { value: BidSelectionPriority.CHEAPEST, label: "Lowest price" },
  { value: BidSelectionPriority.FASTEST, label: "Soonest arrival" },
  { value: BidSelectionPriority.BEST_QUALITY, label: "Highest rated" },
] as const;

export function SimpleJobRequestForm({ homeProfiles }: { homeProfiles: HomeChoice[] }) {
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
  const [homeCondition, setHomeCondition] = useState<HomeCondition | "">("");
  const [priorityAreas, setPriorityAreas] = useState<JobPriorityArea[]>([]);
  const [selectionPriority, setSelectionPriority] = useState<BidSelectionPriority>(
    BidSelectionPriority.BEST_OVERALL,
  );
  const [entryMethod, setEntryMethod] = useState<EntryMethod>(
    homeProfiles[0]?.entryMethod ?? EntryMethod.I_WILL_BE_HOME,
  );
  const [entryNotes, setEntryNotes] = useState(homeProfiles[0]?.entryNotes ?? "");
  const [suppliesSource, setSuppliesSource] = useState<SuppliesSource>(
    homeProfiles[0]?.suppliesSource ?? SuppliesSource.CLEANER_BRINGS_ALL,
  );
  const [notes, setNotes] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
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
  const addressValidation = locationMode === "saved" ? "" : getAddressValidation(address);
  const locationComplete = locationMode === "saved" ? Boolean(selectedHome) : addressValidation === "";
  const soonestAvailable = dateChoice === "soonest";
  const requestedDate = useMemo(() => getRequestedDate(dateChoice, customDate), [customDate, dateChoice]);
  const scheduleValidation = getScheduleValidation(dateChoice, requestedDate, time);
  const scheduleComplete = scheduleValidation === "";
  const detailsComplete = Boolean(selectedCleaning && homeCondition);
  const arrivalComplete = Boolean(entryMethod && suppliesSource);
  const timeEnd = time ? addHours(time, 2) : "";

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      wizardCardRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      questionHeadingRef.current?.focus({ preventScroll: true });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [stage]);

  function goTo(nextStage: Stage) {
    setDirection(nextStage > stage ? "forward" : "back");
    setStage(nextStage);
    setSubmitError("");
    triggerHaptic("light");
  }

  function chooseLocationMode(mode: LocationMode) {
    setLocationMode(mode);
    if (mode === "saved" && selectedHome) {
      setEntryMethod(selectedHome.entryMethod);
      setEntryNotes(selectedHome.entryNotes ?? "");
      setSuppliesSource(selectedHome.suppliesSource);
    }
    setSubmitError("");
    triggerHaptic("selection");
  }

  function chooseSavedHome(home: HomeChoice) {
    setSelectedHomeId(home.id);
    setEntryMethod(home.entryMethod);
    setEntryNotes(home.entryNotes ?? "");
    setSuppliesSource(home.suppliesSource);
    setSubmitError("");
    triggerHaptic("selection");
  }

  function chooseDate(choice: DateChoice) {
    setDateChoice(choice);
    if (choice !== "pick") setCustomDate("");
    triggerHaptic("selection");
  }

  function togglePriorityArea(area: JobPriorityArea) {
    setPriorityAreas((current) =>
      current.includes(area) ? current.filter((item) => item !== area) : [...current, area],
    );
    triggerHaptic("selection");
  }

  function updateAddress(field: keyof AddressState, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    setSubmitError("");
  }

  async function postJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      stage !== 5 ||
      !locationComplete ||
      !scheduleComplete ||
      !detailsComplete ||
      !arrivalComplete ||
      submitState !== "idle"
    ) return;

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

      triggerHaptic("success");
      window.location.assign(`/customer/jobs/${result.jobId}?posted=1`);
    } catch (error) {
      setSubmitState("idle");
      setSubmitError(error instanceof Error ? error.message : "We couldn’t post your request. Try again.");
      triggerHaptic("warning");
    }
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
      <input type="hidden" name="entryMethod" value={entryMethod} />
      <input type="hidden" name="entryNotes" value={entryNotes} />
      <input type="hidden" name="suppliesSource" value={suppliesSource} />
      <input type="hidden" name="cleanLevel" value={selectedCleaning?.cleanLevel ?? CleanLevel.MEDIUM} />
      <input type="hidden" name="cleanType" value={selectedCleaning?.cleanType ?? JobCleanType.STANDARD_CLEAN} />
      <input type="hidden" name="currentCondition" value={homeCondition} />
      <input type="hidden" name="selectionPriority" value={selectionPriority} />
      {(selectedCleaning?.serviceNeeds ?? [ServiceNeed.GENERAL_CLEANING]).map((need) => (
        <input key={need} type="hidden" name="serviceNeeds" value={need} />
      ))}
      {priorityAreas.map((area) => (
        <input key={area} type="hidden" name="matchingPriorityAreas" value={area} />
      ))}
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="saveHome" value={locationMode === "manual" && saveHome ? "true" : "false"} />
      <input type="hidden" name="timingPreference" value={soonestAvailable ? TimingPreference.ASAP : TimingPreference.TIME_SLOT} />
      {!soonestAvailable ? (
        <>
          <input type="hidden" name="requestedDate" value={requestedDate} />
          <input type="hidden" name="requestedWindowStart" value={time} />
          <input type="hidden" name="requestedWindowEnd" value={timeEnd} />
        </>
      ) : null}

      <div className="wk-wizard-card" ref={wizardCardRef}>
        <div className="wk-progress" aria-label={`Step ${stage} of 5`}>
          <span>{String(stage).padStart(2, "0")} / 05</span>
          <i><b style={{ width: `${stage * 20}%` }} /></i>
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
                      onClick={() => chooseSavedHome(home)}
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
                  {(address.addressLine1 || address.city || address.postalCode) && addressValidation ? <p className="wk-form-error" role="alert">{addressValidation}</p> : null}
                  <label className="wk-flex-toggle wk-pressable">
                    <span>Save this home for next time</span>
                    <input checked={saveHome} onChange={(event) => { setSaveHome(event.target.checked); triggerHaptic("selection"); }} type="checkbox" />
                    <i aria-hidden="true" />
                  </label>
                </div>
              )}
              <WizardActions canContinue={locationComplete} nextLabel="Choose a time" onBack={() => window.location.assign("/customer/jobs")} onNext={() => goTo(2)} />
            </section>
          ) : null}

          {stage === 2 ? (
            <section className="wk-form-section">
              <QuestionHeading eyebrow="Date & time" headingRef={questionHeadingRef}>When would you like it cleaned?</QuestionHeading>
              <div className="wk-date-shortcuts" role="group" aria-label="Choose a day">
                {([[
                  "today", "Today",
                ], ["tomorrow", "Tomorrow"], ["pick", "Pick a date"], ["soonest", "Soonest available"]] as const).map(([value, label]) => (
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
              {dateChoice && !soonestAvailable ? (
                <label className="wk-schedule-input">
                  <Clock3 aria-hidden="true" />
                  <span><strong>Arrival time</strong><small>{time ? `${formatTime(time)}–${formatTime(timeEnd)}` : "Choose a two-hour window"}</small></span>
                  <input aria-label="Requested time" max="21:59" onChange={(event) => { setTime(event.target.value); if (event.target.value) triggerHaptic("selection"); }} type="time" value={time} />
                </label>
              ) : null}
              {soonestAvailable ? <p className="wk-form-guidance">Cleaners can offer their earliest available arrival time.</p> : null}
              {dateChoice && scheduleValidation ? <p className="wk-form-error" role="alert">{scheduleValidation}</p> : null}
              <WizardActions canContinue={scheduleComplete} nextLabel="Add details" onBack={() => goTo(1)} onNext={() => goTo(3)} />
            </section>
          ) : null}

          {stage === 3 ? (
            <section className="wk-form-section">
              <QuestionHeading eyebrow="Cleaning scope" headingRef={questionHeadingRef}>What kind of clean do you need?</QuestionHeading>
              <div className="wk-cleaning-choice-list" role="radiogroup" aria-label="Cleaning type">
                {cleaningOptions.map((option) => (
                  <label
                    className={`wk-cleaning-choice wk-pressable${cleaningChoice === option.value ? " is-selected" : ""}`}
                    key={option.value}
                  >
                    <input
                      checked={cleaningChoice === option.value}
                      className="wk-choice-input"
                      name="cleaningChoice"
                      onChange={() => { setCleaningChoice(option.value); triggerHaptic("selection"); }}
                      type="radio"
                      value={option.value}
                    />
                    <span><strong>{option.label}</strong><small>{option.description}</small></span>
                    <span className="wk-choice-check" aria-hidden="true">{cleaningChoice === option.value ? <Check /> : null}</span>
                  </label>
                ))}
              </div>

              <fieldset className="wk-choice-section">
                <legend>What is the home like right now?</legend>
                <div className="wk-cleaning-choice-list">
                  {conditionOptions.map((option) => (
                    <label className={`wk-cleaning-choice wk-pressable${homeCondition === option.value ? " is-selected" : ""}`} key={option.value}>
                      <input checked={homeCondition === option.value} className="wk-choice-input" name="homeConditionChoice" onChange={() => setHomeCondition(option.value)} type="radio" value={option.value} />
                      <span><strong>{option.label}</strong><small>{option.description}</small></span>
                      <span className="wk-choice-check" aria-hidden="true">{homeCondition === option.value ? <Check /> : null}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="wk-choice-section">
                <legend>Priority areas <small>Optional</small></legend>
                <div className="wk-chip-grid">
                  {priorityAreaOptions.map((option) => (
                    <label className={priorityAreas.includes(option.value) ? "is-selected" : ""} key={option.value}>
                      <input checked={priorityAreas.includes(option.value)} onChange={() => togglePriorityArea(option.value)} type="checkbox" value={option.value} />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="wk-choice-section">
                <legend>How should we sort offers?</legend>
                <div className="wk-chip-grid wk-chip-grid--two">
                  {selectionPriorityOptions.map((option) => (
                    <label className={selectionPriority === option.value ? "is-selected" : ""} key={option.value}>
                      <input checked={selectionPriority === option.value} name="selectionPriorityChoice" onChange={() => setSelectionPriority(option.value)} type="radio" value={option.value} />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <WizardActions canContinue={detailsComplete} nextLabel="Arrival details" onBack={() => goTo(2)} onNext={() => goTo(4)} />
            </section>
          ) : null}

          {stage === 4 ? (
            <section className="wk-form-section">
              <QuestionHeading eyebrow="Arrival details" headingRef={questionHeadingRef}>How should the cleaner prepare?</QuestionHeading>
              <div className="wk-address-fields">
                <label>
                  <span>How will the cleaner enter?</span>
                  <select onChange={(event) => setEntryMethod(event.target.value as EntryMethod)} value={entryMethod}>
                    {entryMethodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Who provides supplies?</span>
                  <select onChange={(event) => setSuppliesSource(event.target.value as SuppliesSource)} value={suppliesSource}>
                    {suppliesSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="wk-textarea-field">
                  <span>Entry instructions <small>Optional</small></span>
                  <textarea onChange={(event) => setEntryNotes(event.target.value)} placeholder="Door code, call box, key location, or arrival instructions" value={entryNotes} />
                </label>
                <label className="wk-textarea-field">
                  <span>Anything else cleaners should know? <small>Optional</small></span>
                  <textarea onChange={(event) => setNotes(event.target.value)} placeholder="Pets, parking, fragile items, or special requests" value={notes} />
                </label>
              </div>
              <WizardActions canContinue={arrivalComplete} nextLabel="Review job" onBack={() => goTo(3)} onNext={() => goTo(5)} />
            </section>
          ) : null}

          {stage === 5 ? (
            <section className="wk-form-section">
              <QuestionHeading eyebrow="Summary" headingRef={questionHeadingRef}>Ready to post your job?</QuestionHeading>
              <div className="wk-job-summary">
                <SummaryRow icon={<MapPin />} label="Address" onEdit={() => goTo(1)} value={formatAddress(activeAddress)} />
                <SummaryRow icon={<CalendarDays />} label="When" onEdit={() => goTo(2)} value={soonestAvailable ? "Soonest available" : `${formatDate(requestedDate)} · ${formatTime(time)}–${formatTime(timeEnd)}`} />
                <SummaryRow icon={<Sparkles />} label="Cleaning" onEdit={() => goTo(3)} value={`${selectedCleaning?.label ?? ""} · ${formatCondition(homeCondition)}`} />
                <SummaryRow icon={<Home />} label="Arrival" onEdit={() => goTo(4)} value={`${formatEnumOption(entryMethodOptions, entryMethod)} · ${formatEnumOption(suppliesSourceOptions, suppliesSource)}`} />
                {priorityAreas.length ? <div className="wk-summary-note"><span>Priority areas</span><p>{priorityAreas.map(formatPriorityArea).join(", ")}</p></div> : null}
                {entryNotes ? <div className="wk-summary-note"><span>Entry instructions</span><p>{entryNotes}</p></div> : null}
                {notes ? <div className="wk-summary-note"><span>Your note</span><p>{notes}</p></div> : null}
              </div>
              {submitError ? <p className="wk-form-error" role="alert">{submitError}</p> : null}
              <div className="wk-final-actions">
                <button aria-label="Back to arrival details" className="wk-step-back wk-pressable" onClick={() => goTo(4)} type="button"><ArrowLeft aria-hidden="true" /></button>
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

function getScheduleValidation(choice: DateChoice | "", requestedDate: string, time: string) {
  if (!choice) return "Choose when you would like the cleaning.";
  if (choice === "soonest") return "";
  if (!requestedDate) return "Choose a cleaning date.";
  if (!time) return "Choose an arrival time.";

  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "Choose a valid arrival time.";
  if (hours * 60 + minutes > 21 * 60 + 59) return "Choose a time that leaves the full two-hour window before midnight.";

  const start = new Date(`${requestedDate}T${time}:00`);
  if (start.getTime() <= Date.now()) return "Choose a future arrival time.";
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
  return `${String(hours + amount).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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

function getAddressValidation(address: AddressState) {
  if (address.addressLine1.trim().length < 4) return "Enter a complete street address.";
  if (address.city.trim().length < 2) return "Enter a city.";
  if (address.state.trim().length < 2) return "Enter a state.";
  if (!/^\d{5}(?:-\d{4})?$/.test(address.postalCode.trim())) return "Enter a valid ZIP code.";
  return "";
}

function formatCondition(condition: HomeCondition | "") {
  return conditionOptions.find((option) => option.value === condition)?.label ?? "";
}

function formatPriorityArea(area: JobPriorityArea) {
  return priorityAreaOptions.find((option) => option.value === area)?.label ?? area;
}

function formatEnumOption<T extends string>(options: Array<{ value: T; label: string }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}
