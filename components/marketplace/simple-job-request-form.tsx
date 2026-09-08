"use client";

import {
  BidSelectionPriority,
  CleanLevel,
  EntryMethod,
  HomeCondition,
  JobCleanType,
  ServiceNeed,
  SuppliesSource,
  TimingPreference,
} from "@prisma/client";
import { ArrowLeft, Check, ChevronRight, LoaderCircle, MapPin } from "lucide-react";
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
  suppliesSource: SuppliesSource;
};

type AddressState = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

type LocationMode = "saved" | "manual";
type DateChoice = "today" | "tomorrow" | "weekend" | "pick";
type SectionIndex = 0 | 1 | 2 | 3;
type SubmitState = "idle" | "posting";
type WindowChoice = "morning" | "midday" | "afternoon" | "evening" | "flexible";

const sections = ["Address", "When", "Notes", "Review"] as const;

const emptyAddress: AddressState = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "New York",
  postalCode: "",
};

const dateChoices: Array<{ value: DateChoice; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "This weekend" },
  { value: "pick", label: "Pick a date" },
];

const windowChoices: Array<{
  value: WindowChoice;
  label: string;
  detail: string;
  start: string;
  end: string;
}> = [
  { value: "morning", label: "Morning", detail: "8–11 AM", start: "08:00", end: "11:00" },
  { value: "midday", label: "Midday", detail: "11 AM–2 PM", start: "11:00", end: "14:00" },
  { value: "afternoon", label: "Afternoon", detail: "2–5 PM", start: "14:00", end: "17:00" },
  { value: "evening", label: "Evening", detail: "5–8 PM", start: "17:00", end: "20:00" },
  { value: "flexible", label: "Flexible", detail: "Anytime, 8 AM–8 PM", start: "08:00", end: "20:00" },
];

export function SimpleJobRequestForm({ homeProfiles }: { homeProfiles: HomeChoice[] }) {
  const [activeSection, setActiveSection] = useState<SectionIndex>(0);
  const [highestReached, setHighestReached] = useState<SectionIndex>(0);
  const [locationMode, setLocationMode] = useState<LocationMode>(homeProfiles.length ? "saved" : "manual");
  const [selectedHomeId, setSelectedHomeId] = useState(homeProfiles[0]?.id ?? "");
  const [fullAddress, setFullAddress] = useState("");
  const [dateChoice, setDateChoice] = useState<DateChoice | "">("");
  const [customDate, setCustomDate] = useState("");
  const [windowChoice, setWindowChoice] = useState<WindowChoice | "">("");
  const [notes, setNotes] = useState("");
  const [entryNotes, setEntryNotes] = useState(homeProfiles[0]?.entryNotes ?? "");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasAdvanced = useRef(false);

  const selectedHome = homeProfiles.find((home) => home.id === selectedHomeId) ?? null;
  const activeAddress = locationMode === "saved" && selectedHome
    ? {
        addressLine1: selectedHome.addressLine1,
        addressLine2: selectedHome.addressLine2 ?? "",
        city: selectedHome.city,
        state: selectedHome.state,
        postalCode: selectedHome.postalCode,
      }
    : parseFullAddress(fullAddress);
  const requestedDate = useMemo(
    () => getRequestedDate(dateChoice, customDate),
    [customDate, dateChoice],
  );
  const availableWindows = useMemo(
    () => windowChoices.filter((option) => isWindowAvailable(requestedDate, option.start)),
    [requestedDate],
  );
  const selectedWindow = windowChoices.find((option) => option.value === windowChoice) ?? null;
  const addressComplete = getAddressValidation(activeAddress) === "";
  const whenComplete = Boolean(requestedDate && selectedWindow && isWindowAvailable(requestedDate, selectedWindow.start));
  const entryMethod = locationMode === "saved" && selectedHome
    ? selectedHome.entryMethod
    : EntryMethod.OTHER;
  const suppliesSource = locationMode === "saved" && selectedHome
    ? selectedHome.suppliesSource
    : SuppliesSource.CLEANER_BRINGS_ALL;

  useEffect(() => {
    if (!hasAdvanced.current) return;
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      headingRef.current?.focus({ preventScroll: true });
    }, 20);
    return () => window.clearTimeout(timer);
  }, [activeSection]);

  function openSection(index: SectionIndex) {
    if (index > highestReached) return;
    if (index === 3 && (!addressComplete || !whenComplete)) return;
    hasAdvanced.current = true;
    setActiveSection(index);
    setSubmitError("");
    triggerHaptic("light");
  }

  function advanceTo(index: SectionIndex) {
    hasAdvanced.current = true;
    setActiveSection(index);
    setHighestReached((current) => Math.max(current, index) as SectionIndex);
    setSubmitError("");
    triggerHaptic("light");
  }

  function chooseLocationMode(mode: LocationMode) {
    setLocationMode(mode);
    if (mode === "saved" && selectedHome) setEntryNotes(selectedHome.entryNotes ?? "");
    if (mode === "manual") setEntryNotes("");
    setSubmitError("");
    triggerHaptic("selection");
  }

  function chooseSavedHome(home: HomeChoice) {
    setSelectedHomeId(home.id);
    setEntryNotes(home.entryNotes ?? "");
    setSubmitError("");
    triggerHaptic("selection");
    advanceTo(1);
  }

  function chooseDate(choice: DateChoice) {
    setDateChoice(choice);
    setWindowChoice("");
    if (choice !== "pick") setCustomDate("");
    triggerHaptic("selection");
  }

  function chooseWindow(value: WindowChoice) {
    setWindowChoice(value);
    setSubmitError("");
    triggerHaptic("selection");
    advanceTo(2);
  }

  async function postJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeSection !== 3 || !addressComplete || !whenComplete || submitState !== "idle") return;

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

  const addressSummary = addressComplete ? formatAddress(activeAddress) : "Add the cleaning address";
  const whenSummary = whenComplete && selectedWindow
    ? `${formatDate(requestedDate)} · ${selectedWindow.label} (${selectedWindow.detail})`
    : "Choose a date and arrival window";
  const notesSummary = notes.trim() ? summarizeText(notes) : "No extra notes";

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
      <input type="hidden" name="entryNotes" value={entryNotes.trim()} />
      <input type="hidden" name="suppliesSource" value={suppliesSource} />
      <input type="hidden" name="cleanLevel" value={CleanLevel.MEDIUM} />
      <input type="hidden" name="cleanType" value={JobCleanType.STANDARD_CLEAN} />
      <input type="hidden" name="currentCondition" value={HomeCondition.NORMAL_LIVED_IN} />
      <input type="hidden" name="selectionPriority" value={BidSelectionPriority.BEST_OVERALL} />
      {[
        ServiceNeed.GENERAL_CLEANING,
        ServiceNeed.KITCHEN,
        ServiceNeed.BATHROOMS,
        ServiceNeed.FLOORS,
        ServiceNeed.DUSTING,
      ].map((need) => <input key={need} type="hidden" name="serviceNeeds" value={need} />)}
      <input type="hidden" name="notes" value={notes.trim()} />
      <input type="hidden" name="saveHome" value="false" />
      <input type="hidden" name="timingPreference" value={TimingPreference.TIME_SLOT} />
      <input type="hidden" name="requestedDate" value={requestedDate} />
      <input type="hidden" name="requestedWindowStart" value={selectedWindow?.start ?? ""} />
      <input type="hidden" name="requestedWindowEnd" value={selectedWindow?.end ?? ""} />

      <div className="wk-wizard-card wk-post-flow">
        <div className="wk-post-flow__progress" aria-label={`Step ${activeSection + 1} of 4`}>
          <span>{activeSection + 1} of 4</span>
          <progress max="4" value={activeSection + 1}>Step {activeSection + 1} of 4</progress>
        </div>

        <div className="wk-post-flow__sections">
          {sections.map((section, index) => {
            const sectionIndex = index as SectionIndex;
            const isActive = activeSection === sectionIndex;
            const isComplete = sectionIndex <= highestReached && (
              sectionIndex !== 3 || (addressComplete && whenComplete)
            );

            if (activeSection === 3 && sectionIndex < 3) return null;

            if (isActive) {
              return (
                <section className="wk-post-section is-active" key={section}>
                  {sectionIndex === 0 ? (
                    <AddressSection
                      addressComplete={addressComplete}
                      fullAddress={fullAddress}
                      headingRef={headingRef}
                      homeProfiles={homeProfiles}
                      locationMode={locationMode}
                      onAdvance={() => advanceTo(1)}
                      onChooseHome={chooseSavedHome}
                      onChooseMode={chooseLocationMode}
                      onFullAddress={(value) => { setFullAddress(value); setSubmitError(""); }}
                      selectedHomeId={selectedHomeId}
                    />
                  ) : null}
                  {sectionIndex === 1 ? (
                    <WhenSection
                      availableWindows={availableWindows}
                      customDate={customDate}
                      dateChoice={dateChoice}
                      headingRef={headingRef}
                      onChooseDate={chooseDate}
                      onChooseWindow={chooseWindow}
                      onCustomDate={(value) => { setCustomDate(value); setWindowChoice(""); }}
                      requestedDate={requestedDate}
                      windowChoice={windowChoice}
                    />
                  ) : null}
                  {sectionIndex === 2 ? (
                    <NotesSection
                      headingRef={headingRef}
                      notes={notes}
                      onAdvance={() => advanceTo(3)}
                      onNotes={setNotes}
                    />
                  ) : null}
                  {sectionIndex === 3 ? (
                    <ReviewSection
                      address={addressSummary}
                      headingRef={headingRef}
                      notes={notesSummary}
                      onEdit={openSection}
                      submitError={submitError}
                      submitState={submitState}
                      when={whenSummary}
                    />
                  ) : null}
                </section>
              );
            }

            if (isComplete) {
              const summaries = [addressSummary, whenSummary, notesSummary, "Ready to post"];
              return (
                <section className="wk-post-section is-complete" key={section}>
                  <button
                    aria-label={sectionIndex === 3 ? "Return to review" : `Edit ${section.toLowerCase()}`}
                    className="wk-post-section__summary wk-pressable"
                    onClick={() => openSection(sectionIndex)}
                    type="button"
                  >
                    <span className="wk-post-section__status" aria-hidden="true"><Check /></span>
                    <span><small>{section}</small><strong>{summaries[index]}</strong></span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                </section>
              );
            }

            return null;
          })}
        </div>
      </div>
    </form>
  );
}

function AddressSection({
  addressComplete,
  fullAddress,
  headingRef,
  homeProfiles,
  locationMode,
  onAdvance,
  onChooseHome,
  onChooseMode,
  onFullAddress,
  selectedHomeId,
}: {
  addressComplete: boolean;
  fullAddress: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  homeProfiles: HomeChoice[];
  locationMode: LocationMode;
  onAdvance: () => void;
  onChooseHome: (home: HomeChoice) => void;
  onChooseMode: (mode: LocationMode) => void;
  onFullAddress: (value: string) => void;
  selectedHomeId: string;
}) {
  const addressError = locationMode === "manual" ? getFullAddressValidation(fullAddress) : "";
  const hasStartedAddress = Boolean(fullAddress.trim());

  return (
    <div className="wk-post-section__content">
      <QuestionHeading headingRef={headingRef}>Where do you need cleaned?</QuestionHeading>

      {locationMode === "saved" && homeProfiles.length ? (
        <div className="wk-post-home-list" role="radiogroup" aria-label="Saved addresses">
          {homeProfiles.map((home) => (
            <button
              aria-checked={selectedHomeId === home.id}
              className={selectedHomeId === home.id ? "is-selected" : ""}
              key={home.id}
              onClick={() => onChooseHome(home)}
              role="radio"
              type="button"
            >
              <MapPin aria-hidden="true" />
              <span><strong>{home.label}</strong><small>{formatAddress(home)}</small></span>
              {selectedHomeId === home.id ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
          <button className="wk-post-text-action" onClick={() => onChooseMode("manual")} type="button">
            <MapPin aria-hidden="true" />
            <span><strong>Another address</strong><small>Enter a different location</small></span>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="wk-post-address-fields wk-post-address-fields--single">
          <label>
            <span>Full address</span>
            <div className="wk-post-address-input">
              <MapPin aria-hidden="true" />
              <input
                autoComplete="street-address"
                autoFocus
                onChange={(event) => onFullAddress(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && addressComplete) {
                    event.preventDefault();
                    onAdvance();
                  }
                }}
                placeholder="Street, city, state ZIP"
                value={fullAddress}
              />
            </div>
          </label>
          {hasStartedAddress && addressError ? <p className="wk-post-inline-error" role="alert">{addressError}</p> : null}
          {homeProfiles.length ? (
            <button className="wk-post-back-to-saved" onClick={() => onChooseMode("saved")} type="button">
              <ArrowLeft aria-hidden="true" /> Saved address
            </button>
          ) : null}
        </div>
      )}

      <PrimaryStepAction disabled={!addressComplete} label="Continue" onClick={onAdvance} />
    </div>
  );
}

function WhenSection({
  availableWindows,
  customDate,
  dateChoice,
  headingRef,
  onChooseDate,
  onChooseWindow,
  onCustomDate,
  requestedDate,
  windowChoice,
}: {
  availableWindows: typeof windowChoices;
  customDate: string;
  dateChoice: DateChoice | "";
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onChooseDate: (choice: DateChoice) => void;
  onChooseWindow: (choice: WindowChoice) => void;
  onCustomDate: (value: string) => void;
  requestedDate: string;
  windowChoice: WindowChoice | "";
}) {
  return (
    <div className="wk-post-section__content">
      <QuestionHeading headingRef={headingRef}>When?</QuestionHeading>

      <fieldset className="wk-post-choice-group">
        <legend>Choose a day</legend>
        <div className="wk-post-quick-grid">
          {dateChoices.map((option) => (
            <button aria-pressed={dateChoice === option.value} key={option.value} onClick={() => onChooseDate(option.value)} type="button">
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {dateChoice === "pick" ? (
        <label className="wk-post-date-input">
          <span>Cleaning date</span>
          <input aria-label="Cleaning date" min={getLocalDate(0)} onChange={(event) => onCustomDate(event.target.value)} type="date" value={customDate} />
        </label>
      ) : null}

      {requestedDate ? (
        <fieldset className="wk-post-choice-group">
          <legend>Choose an arrival window</legend>
          {availableWindows.length ? (
            <div className="wk-post-window-grid">
              {availableWindows.map((option) => (
                <button aria-pressed={windowChoice === option.value} key={option.value} onClick={() => onChooseWindow(option.value)} type="button">
                  <strong>{option.label}</strong><span>{option.detail}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="wk-post-guidance">No arrival windows remain today. Choose another day.</p>
          )}
        </fieldset>
      ) : null}
    </div>
  );
}

function NotesSection({
  headingRef,
  notes,
  onAdvance,
  onNotes,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  notes: string;
  onAdvance: () => void;
  onNotes: (value: string) => void;
}) {
  return (
    <div className="wk-post-section__content">
      <QuestionHeading headingRef={headingRef}>Anything we should know?</QuestionHeading>
      <div className="wk-post-notes-fields">
        <label>
          <span>Notes <small>Optional</small></span>
          <textarea onChange={(event) => onNotes(event.target.value)} placeholder="Rooms to focus on, pets, parking, or entry details" value={notes} />
        </label>
      </div>
      <PrimaryStepAction label="Review" onClick={onAdvance} />
    </div>
  );
}

function ReviewSection({
  address,
  headingRef,
  notes,
  onEdit,
  submitError,
  submitState,
  when,
}: {
  address: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  notes: string;
  onEdit: (section: SectionIndex) => void;
  submitError: string;
  submitState: SubmitState;
  when: string;
}) {
  return (
    <div className="wk-post-section__content">
      <QuestionHeading headingRef={headingRef}>Ready to post?</QuestionHeading>
      <div className="wk-post-review" aria-label="Job summary">
        <ReviewRow label="Address" onClick={() => onEdit(0)} value={address} />
        <ReviewRow label="When" onClick={() => onEdit(1)} value={when} />
        <ReviewRow label="Notes" onClick={() => onEdit(2)} value={notes} />
      </div>
      {submitError ? <p className="wk-post-inline-error" role="alert">{submitError}</p> : null}
      <button
        aria-busy={submitState === "posting"}
        className="wk-post-primary wk-pressable"
        disabled={submitState === "posting"}
        type="submit"
      >
        {submitState === "posting" ? <><LoaderCircle className="wk-button-spinner" aria-hidden="true" /> Posting</> : <>Post job <ChevronRight aria-hidden="true" /></>}
      </button>
    </div>
  );
}

function QuestionHeading({
  children,
  headingRef,
}: {
  children: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="wk-question-heading">
      <h2 ref={headingRef} tabIndex={-1}>{children}</h2>
    </div>
  );
}

function PrimaryStepAction({
  disabled = false,
  label,
  onClick,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="wk-post-primary wk-pressable" disabled={disabled} onClick={onClick} type="button">
      {label} <ChevronRight aria-hidden="true" />
    </button>
  );
}

function ReviewRow({ label, onClick, value }: { label: string; onClick: () => void; value: string }) {
  return (
    <button className="wk-post-review__row wk-pressable" onClick={onClick} type="button">
      <span><small>{label}</small><strong>{value}</strong></span>
      <ChevronRight aria-hidden="true" />
    </button>
  );
}

function getRequestedDate(choice: DateChoice | "", customDate: string) {
  if (choice === "today") return getLocalDate(0);
  if (choice === "tomorrow") return getLocalDate(1);
  if (choice === "weekend") return getWeekendDate();
  if (choice === "pick") return customDate;
  return "";
}

function getWeekendDate() {
  const today = new Date();
  const day = today.getDay();
  const offset = day === 0 || day === 6 ? 0 : 6 - day;
  return getLocalDate(offset);
}

function getLocalDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWindowAvailable(date: string, start: string) {
  if (!date) return false;
  return new Date(`${date}T${start}:00`).getTime() > Date.now();
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatAddress(address: {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
}) {
  return [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state].filter(Boolean).join(", ") + (address.postalCode ? ` ${address.postalCode}` : ""),
  ].filter(Boolean).join(", ");
}

function getAddressValidation(address: AddressState) {
  if (address.addressLine1.trim().length < 4) return "Enter a complete street address.";
  if (address.city.trim().length < 2) return "Enter a city.";
  if (address.state.trim().length < 2) return "Enter a state.";
  if (!/^\d{5}(?:-\d{4})?$/.test(address.postalCode.trim())) return "Enter a valid ZIP code.";
  return "";
}

function parseFullAddress(value: string): AddressState {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 3) return emptyAddress;

  const stateAndZip = parts.at(-1)?.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
  if (!stateAndZip) return emptyAddress;

  return {
    addressLine1: parts.slice(0, -2).join(", "),
    addressLine2: "",
    city: parts.at(-2) ?? "",
    state: stateAndZip[1].trim(),
    postalCode: stateAndZip[2],
  };
}

function getFullAddressValidation(value: string) {
  return getAddressValidation(parseFullAddress(value)) ? "Use: street, city, state ZIP." : "";
}

function summarizeText(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 72 ? `${normalized.slice(0, 69).trimEnd()}…` : normalized;
}
