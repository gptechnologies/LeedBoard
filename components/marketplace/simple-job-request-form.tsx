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
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  ImagePlus,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FormEvent, useMemo, useRef, useState } from "react";

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

type TimeMode = "custom" | "morning" | "afternoon";
type SubmitState = "idle" | "posting";
type ActiveSection = 1 | 2 | 3;

const emptyAddress: AddressState = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "New York",
  postalCode: "",
};

const timeModes: Array<{ value: TimeMode; label: string }> = [
  { value: "custom", label: "Custom" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
];

const presetTimes: Record<Exclude<TimeMode, "custom">, { start: string; end: string }> = {
  morning: { start: "08:00", end: "12:00" },
  afternoon: { start: "12:00", end: "17:00" },
};

export function SimpleJobRequestForm({ homeProfiles }: { homeProfiles: HomeChoice[] }) {
  const reduceMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState<ActiveSection>(1);
  const [revealedThrough, setRevealedThrough] = useState<ActiveSection>(1);
  const [fullAddress, setFullAddress] = useState(() => homeProfiles[0] ? formatAddress(homeProfiles[0]) : "");
  const [requestedDate, setRequestedDate] = useState("");
  const [timeMode, setTimeMode] = useState<TimeMode>("morning");
  const [customStart, setCustomStart] = useState("09:00");
  const [customEnd, setCustomEnd] = useState("13:00");
  const [notes, setNotes] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const whenSectionRef = useRef<HTMLElement>(null);
  const notesSectionRef = useRef<HTMLElement>(null);

  const selectedHome = homeProfiles.find((home) => formatAddress(home) === fullAddress.trim()) ?? null;
  const activeAddress = selectedHome
    ? {
        addressLine1: selectedHome.addressLine1,
        addressLine2: selectedHome.addressLine2 ?? "",
        city: selectedHome.city,
        state: selectedHome.state,
        postalCode: selectedHome.postalCode,
      }
    : parseFullAddress(fullAddress);
  const addressComplete = getAddressValidation(activeAddress) === "";
  const schedule = useMemo(
    () => timeMode === "custom" ? { start: customStart, end: customEnd } : presetTimes[timeMode],
    [customEnd, customStart, timeMode],
  );
  const whenValidation = getWhenValidation(requestedDate, schedule.start, schedule.end);
  const whenComplete = whenValidation === "";
  const entryMethod = selectedHome ? selectedHome.entryMethod : EntryMethod.OTHER;
  const entryNotes = selectedHome ? selectedHome.entryNotes ?? "" : "";
  const suppliesSource = selectedHome
    ? selectedHome.suppliesSource
    : SuppliesSource.CLEANER_BRINGS_ALL;

  function gentlyReveal(target: React.RefObject<HTMLElement | null>, section: ActiveSection) {
    setActiveSection(section);
    setRevealedThrough((current) => Math.max(current, section) as ActiveSection);
    window.setTimeout(() => {
      target.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  }

  async function postJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!addressComplete || !whenComplete || submitState !== "idle") return;

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
    <form action="/customer/jobs/create" className="wk-job-composer" method="post" onSubmit={postJob}>
      <input type="hidden" name="title" value="Home Cleaning" />
      <input type="hidden" name="homeProfileId" value={selectedHome?.id ?? ""} />
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
      {[ServiceNeed.GENERAL_CLEANING, ServiceNeed.KITCHEN, ServiceNeed.BATHROOMS, ServiceNeed.FLOORS, ServiceNeed.DUSTING].map((need) => (
        <input key={need} type="hidden" name="serviceNeeds" value={need} />
      ))}
      <input type="hidden" name="notes" value={notes.trim()} />
      <input type="hidden" name="saveHome" value="false" />
      <input type="hidden" name="timingPreference" value={TimingPreference.TIME_SLOT} />
      <input type="hidden" name="requestedDate" value={requestedDate} />
      <input type="hidden" name="requestedWindowStart" value={schedule.start} />
      <input type="hidden" name="requestedWindowEnd" value={schedule.end} />

      <header className="wk-job-composer__intro">
        <span aria-hidden="true" className="wk-job-composer__script">Good spaces<br />brighter days ✦</span>
        <h1>Post a job</h1>
        <p>Tell us where and when. Cleaners will send prices.</p>
      </header>

      <section
        className={`wk-composer-section${activeSection === 1 ? " is-active" : ""}`}
        onFocus={() => setActiveSection(1)}
      >
        <ComposerHeading number="01">Where do you need cleaned?</ComposerHeading>
        <div className="wk-composer-control wk-composer-address">
          <MapPin aria-hidden="true" />
          <input
            aria-describedby="composer-address-hint"
            aria-label="Cleaning address"
            autoComplete="street-address"
            autoFocus={!homeProfiles.length}
            list={homeProfiles.length ? "composer-saved-addresses" : undefined}
            onBlur={() => {
              if (addressComplete) gentlyReveal(whenSectionRef, 2);
            }}
            onChange={(event) => { setFullAddress(event.target.value); setSubmitError(""); }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && addressComplete) {
                event.preventDefault();
                gentlyReveal(whenSectionRef, 2);
              }
            }}
            placeholder="Street, city, state ZIP"
            value={fullAddress}
          />
          {addressComplete ? <span className="wk-composer-check" aria-label="Address complete"><Check /></span> : null}
        </div>
        <p className="sr-only" id="composer-address-hint">Enter a street, city, state, and ZIP code.</p>
        {homeProfiles.length ? (
          <datalist id="composer-saved-addresses">
            {homeProfiles.map((home) => <option key={home.id} value={formatAddress(home)} />)}
          </datalist>
        ) : null}
      </section>

      <AnimatePresence initial={false}>
        {revealedThrough >= 2 ? (
          <motion.div
            animate={{ height: "auto", opacity: 1, y: 0 }}
            className="wk-composer-reveal"
            exit={reduceMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0, y: -8 }}
            initial={reduceMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0, y: 16 }}
            key="schedule"
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <section
              className={`wk-composer-section${activeSection === 2 ? " is-active" : ""}`}
              onFocus={() => setActiveSection(2)}
              ref={whenSectionRef}
            >
              <ComposerHeading number="02">When should cleaners arrive?</ComposerHeading>
              <div className="wk-composer-schedule-grid">
                <label className="wk-composer-control">
                  <CalendarDays aria-hidden="true" />
                  <span className={`wk-composer-value${requestedDate ? "" : " is-placeholder"}`}>
                    {requestedDate ? formatDate(requestedDate) : "Choose date"}
                  </span>
                  <input
                    aria-label="Cleaning date"
                    className="wk-composer-native-picker"
                    min={getLocalDate(0)}
                    onChange={(event) => {
                      setRequestedDate(event.target.value);
                      setSubmitError("");
                      if (getWhenValidation(event.target.value, schedule.start, schedule.end) === "") {
                        gentlyReveal(notesSectionRef, 3);
                      }
                    }}
                    type="date"
                    value={requestedDate}
                  />
                  <ChevronDown aria-hidden="true" className="wk-composer-chevron" />
                </label>
                <label className="wk-composer-control">
                  <Clock3 aria-hidden="true" />
                  <span className="wk-composer-value">{timeModes.find((option) => option.value === timeMode)?.label}</span>
                  <select
                    aria-label="Arrival window"
                    className="wk-composer-native-picker"
                    onChange={(event) => {
                      const value = event.target.value as TimeMode;
                      setTimeMode(value);
                      setSubmitError("");
                      triggerHaptic("selection");
                    }}
                    value={timeMode}
                  >
                    {timeModes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <ChevronDown aria-hidden="true" className="wk-composer-chevron" />
                </label>
              </div>

              <div aria-hidden={timeMode !== "custom"} className={`wk-composer-custom-time${timeMode === "custom" ? " is-visible" : ""}`}>
                <div>
                  <TimeControl active={timeMode === "custom"} label="Arrive" onChange={(value) => setCustomStart(value)} value={customStart} />
                  <TimeControl active={timeMode === "custom"} label="Finish" onChange={(value) => setCustomEnd(value)} value={customEnd} />
                </div>
              </div>
              {requestedDate && whenValidation ? <p className="wk-composer-error" role="alert">{whenValidation}</p> : null}
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {revealedThrough >= 3 ? (
          <motion.div
            animate={{ height: "auto", opacity: 1, y: 0 }}
            className="wk-composer-reveal"
            exit={reduceMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0, y: -8 }}
            initial={reduceMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0, y: 16 }}
            key="notes"
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <section
              className={`wk-composer-section${activeSection === 3 ? " is-active" : ""}`}
              onFocus={() => setActiveSection(3)}
              ref={notesSectionRef}
            >
              <ComposerHeading number="03">Anything cleaners should know?</ComposerHeading>
              <label className="wk-composer-notes">
                <span className="sr-only">Notes for cleaners</span>
                <textarea
                  maxLength={500}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Home details, areas to focus on, entry instructions, pets, elevator or buzzer details."
                  value={notes}
                />
                <small>{notes.length}/500</small>
              </label>
              <label className="wk-composer-photo-button">
                <ImagePlus aria-hidden="true" />
                <span>{photoCount ? `${photoCount} ${photoCount === 1 ? "photo" : "photos"} selected` : "Add photos"}</span>
                <input
                  accept="image/*"
                  aria-label="Add photos"
                  multiple
                  onChange={(event) => setPhotoCount(event.target.files?.length ?? 0)}
                  type="file"
                />
              </label>
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {revealedThrough >= 3 ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="wk-composer-submit is-visible"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            key="submit"
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {submitError ? <p className="wk-composer-error" role="alert">{submitError}</p> : null}
            <button
              aria-busy={submitState === "posting"}
              className="wk-composer-submit__button wk-pressable"
              disabled={!addressComplete || !whenComplete || submitState === "posting"}
              type="submit"
            >
              {submitState === "posting" ? (
                <><LoaderCircle className="wk-button-spinner" aria-hidden="true" /> Posting</>
              ) : (
                <><span>Post Job</span><ArrowRight aria-hidden="true" /></>
              )}
            </button>
            <p>By posting, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}

function ComposerHeading({ children, number }: { children: string; number: string }) {
  return (
    <div className="wk-composer-heading">
      <span aria-hidden="true">{number}</span>
      <h2>{children}</h2>
    </div>
  );
}

function TimeControl({ active, label, onChange, value }: { active: boolean; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="wk-composer-control wk-composer-time-control">
      <Clock3 aria-hidden="true" />
      <span><small>{label}</small><strong>{formatTime(value)}</strong></span>
      <input className="wk-composer-native-picker" aria-label={`${label} time`} disabled={!active} onChange={(event) => onChange(event.target.value)} type="time" value={value} />
      <ChevronDown aria-hidden="true" className="wk-composer-chevron" />
    </label>
  );
}

function getLocalDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function getWhenValidation(date: string, start: string, end: string) {
  if (!date) return "Choose a cleaning date.";
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  if (!start || !end || duration < 120 || duration > 720) return "Choose a time range between 2 and 12 hours.";
  if (new Date(`${date}T${start}:00`).getTime() <= Date.now()) return "Choose a future arrival time.";
  return "";
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
