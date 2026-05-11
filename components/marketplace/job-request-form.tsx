"use client";

import Link from "next/link";
import {
  CleanLevel,
  EntryMethod,
  RoomType,
  ServiceNeed,
  TimingPreference,
} from "@prisma/client";
import { FormEvent, useRef, useState } from "react";
import {
  entryMethodOptions,
} from "@/lib/marketplace-constants";
import { PulsatingPrimaryButton } from "@/components/marketplace/motion-buttons";

type RoomCleanLevels = Partial<Record<RoomType, CleanLevel>>;
type DayChoice = "" | "today" | "another";
type ArrivalChoice = "" | "asap" | "window";

type WizardHomeProfile = {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  bedroomCount: number | null;
  bathroomCount: number | null;
  estimatedSquareFeet: number | null;
  storyCount: number | null;
  hasPets: boolean;
  entryMethod: EntryMethod;
  entryNotes: string | null;
  defaultRoomTypes: RoomType[];
  defaultCleanLevel: CleanLevel;
  roomCleanLevels: unknown;
  notes: string | null;
};

type LocationEditorMode = "closed" | "edit" | "new";

type LocationDraft = {
  label: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  bedroomCount: number | null;
  bathroomCount: number | null;
  estimatedSquareFeet: number | null;
  storyCount: number | null;
  hasPets: boolean;
};

const steps = ["Details", "Schedule", "Review"] as const;
const dateHints = ["Fastest", "Popular", "Flexible", "Good fit", "Open", "Open", "Open", "Open"];
const defaultWholeHomeRooms = [
  RoomType.KITCHEN,
  RoomType.BATHROOM,
  RoomType.BEDROOM,
  RoomType.LIVING_AREA,
  RoomType.DINING_ROOM,
  RoomType.ENTRYWAY,
];
function parseRawRoomCleanLevels(raw: unknown): RoomCleanLevels {
  if (!raw || typeof raw !== "object") return {};
  const result: RoomCleanLevels = {};
  const validRooms = Object.values(RoomType) as string[];
  const validLevels = Object.values(CleanLevel) as string[];
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (validRooms.includes(key) && validLevels.includes(String(value))) {
      result[key as RoomType] = String(value) as CleanLevel;
    }
  }
  return result;
}

function initRoomCleanLevels(profile: WizardHomeProfile | null): RoomCleanLevels {
  if (!profile) return getDefaultWholeHomeCleanLevels();
  const parsed = parseRawRoomCleanLevels(profile.roomCleanLevels);
  if (Object.keys(parsed).length > 0) return parsed;
  const map: RoomCleanLevels = {};
  const roomTypes = profile.defaultRoomTypes.length > 0 ? profile.defaultRoomTypes : defaultWholeHomeRooms;
  for (const room of roomTypes) {
    map[room] = profile.defaultCleanLevel;
  }
  return map;
}

function getDefaultWholeHomeCleanLevels(): RoomCleanLevels {
  return Object.fromEntries(defaultWholeHomeRooms.map((room) => [room, CleanLevel.MEDIUM]));
}

function getDominantCleanLevel(levels: RoomCleanLevels): CleanLevel {
  const values = Object.values(levels);
  if (values.length === 0) return CleanLevel.MEDIUM;
  if (values.includes(CleanLevel.DEEP)) return CleanLevel.DEEP;
  if (values.includes(CleanLevel.MEDIUM)) return CleanLevel.MEDIUM;
  return CleanLevel.LIGHT;
}

export function JobRequestForm({ homeProfiles }: { homeProfiles: WizardHomeProfile[] }) {
  const initialHomeProfile = homeProfiles[0] ?? null;
  const [savedHomeProfiles, setSavedHomeProfiles] = useState(homeProfiles);
  const [selectedHomeProfileId, setSelectedHomeProfileId] = useState(initialHomeProfile?.id ?? "");
  const [step, setStep] = useState(0);
  const [addressLine1, setAddressLine1] = useState(initialHomeProfile?.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(initialHomeProfile?.addressLine2 ?? "");
  const [city, setCity] = useState(initialHomeProfile?.city ?? "");
  const [state, setState] = useState(initialHomeProfile?.state ?? "New York");
  const [postalCode, setPostalCode] = useState(initialHomeProfile?.postalCode ?? "");
  const [roomCleanLevels, setRoomCleanLevels] = useState<RoomCleanLevels>(
    () => initRoomCleanLevels(initialHomeProfile),
  );
  const [entryMethod, setEntryMethod] = useState<EntryMethod>(
    initialHomeProfile?.entryMethod ?? EntryMethod.I_WILL_BE_HOME,
  );
  const [entryNotes, setEntryNotes] = useState(initialHomeProfile?.entryNotes ?? "");
  const [timingPreference, setTimingPreference] = useState<TimingPreference>(TimingPreference.ASAP);
  const [dayChoice, setDayChoice] = useState<DayChoice>("");
  const [arrivalChoice, setArrivalChoice] = useState<ArrivalChoice>("");
  const [requestedDate, setRequestedDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");
  const [endHour, setEndHour] = useState("");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");
  const [notes, setNotes] = useState("");
  const [locationEditorMode, setLocationEditorMode] = useState<LocationEditorMode>(
    initialHomeProfile ? "closed" : "new",
  );
  const [locationDraft, setLocationDraft] = useState<LocationDraft>(() =>
    getLocationDraft(initialHomeProfile),
  );
  const [locationSaveMessage, setLocationSaveMessage] = useState("");
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const wizardTopRef = useRef<HTMLDivElement>(null);
  const submitIntentRef = useRef(false);

  const roomTypes = Object.keys(roomCleanLevels) as RoomType[];
  const cleanLevel = getDominantCleanLevel(roomCleanLevels);
  const serviceNeeds = deriveServiceNeeds(roomTypes, cleanLevel);
  const dateOptions = getDateOptions();
  const hourOptions = getHourOptions();
  const todayValue = dateOptions[0]?.value ?? toDateInputValue(new Date());
  const windowStartTime = startHour ? to24h(startHour, startPeriod) : "";
  const windowEndTime = endHour ? to24h(endHour, endPeriod) : "";
  const selectedWindow = getWindowLabel(windowStartTime, windowEndTime);
  const hasAddress = Boolean(addressLine1.trim() && city.trim() && state.trim() && postalCode.trim());
  const hasScheduleDay = dayChoice === "today" || (dayChoice === "another" && Boolean(requestedDate));
  const hasScheduleArrival =
    arrivalChoice === "asap" ||
    (arrivalChoice === "window" && Boolean(startHour && endHour));
  const canContinueFromSchedule = hasScheduleDay && hasScheduleArrival;

  const selectedHomeProfile =
    savedHomeProfiles.find((homeProfile) => homeProfile.id === selectedHomeProfileId) ?? null;
  const isUsingPreset =
    !!selectedHomeProfile &&
    addressLine1 === selectedHomeProfile.addressLine1 &&
    addressLine2 === (selectedHomeProfile.addressLine2 ?? "") &&
    city === selectedHomeProfile.city &&
    state === selectedHomeProfile.state &&
    postalCode === selectedHomeProfile.postalCode &&
    entryMethod === selectedHomeProfile.entryMethod &&
    entryNotes === (selectedHomeProfile.entryNotes ?? "");

  function applyHomeProfile(profile: WizardHomeProfile) {
    setSelectedHomeProfileId(profile.id);
    setAddressLine1(profile.addressLine1);
    setAddressLine2(profile.addressLine2 ?? "");
    setCity(profile.city);
    setState(profile.state);
    setPostalCode(profile.postalCode);
    setRoomCleanLevels(initRoomCleanLevels(profile));
    setEntryMethod(profile.entryMethod);
    setEntryNotes(profile.entryNotes ?? "");
    setLocationDraft(getLocationDraft(profile));
    setLocationEditorMode("closed");
    setLocationSaveMessage("");
    setValidationMessage("");
  }

  function choosePresetForEdit(profile: WizardHomeProfile) {
    setSelectedHomeProfileId(profile.id);
    setAddressLine1(profile.addressLine1);
    setAddressLine2(profile.addressLine2 ?? "");
    setCity(profile.city);
    setState(profile.state);
    setPostalCode(profile.postalCode);
    setRoomCleanLevels(initRoomCleanLevels(profile));
    setEntryMethod(profile.entryMethod);
    setEntryNotes(profile.entryNotes ?? "");
    setLocationDraft(getLocationDraft(profile));
    setLocationEditorMode("edit");
    setLocationSaveMessage("");
    setValidationMessage("");
  }

  function updateLocationDraft<K extends keyof LocationDraft>(field: K, value: LocationDraft[K]) {
    setLocationDraft((current) => ({ ...current, [field]: value }));
    setLocationSaveMessage("");
  }

  function openEditLocation() {
    setLocationDraft(getLocationDraft(selectedHomeProfile));
    setLocationEditorMode("edit");
    setLocationSaveMessage("");
  }

  function openNewLocation() {
    setLocationDraft(getLocationDraft(null));
    setLocationEditorMode("new");
    setLocationSaveMessage("");
  }

  function cancelLocationEdit() {
    setLocationDraft(getLocationDraft(selectedHomeProfile));
    setLocationEditorMode("closed");
    setLocationSaveMessage("");
  }

  async function saveLocation() {
    const message = validateLocationDraft(locationDraft);
    if (message) {
      setLocationSaveMessage(message);
      return;
    }

    setIsSavingLocation(true);
    setLocationSaveMessage("");

    try {
      const response = await fetch("/customer/jobs/home-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeProfileId: locationEditorMode === "edit" ? selectedHomeProfile?.id : undefined,
          ...locationDraft,
          entryMethod,
          entryNotes,
        }),
      });
      const payload = (await response.json()) as {
        homeProfile?: WizardHomeProfile;
        error?: string;
      };

      if (!response.ok || !payload.homeProfile) {
        throw new Error(payload.error || "Unable to save this location.");
      }

      setSavedHomeProfiles((current) => {
        const existingIndex = current.findIndex((profile) => profile.id === payload.homeProfile?.id);
        if (existingIndex < 0) return [payload.homeProfile!, ...current];
        return current.map((profile) =>
          profile.id === payload.homeProfile?.id ? payload.homeProfile! : profile,
        );
      });
      applyHomeProfile(payload.homeProfile);
    } catch (error) {
      setLocationSaveMessage(
        error instanceof Error ? error.message : "Unable to save this location.",
      );
    } finally {
      setIsSavingLocation(false);
    }
  }

  function goNext() {
    if (step === 0 && !hasAddress) {
      setValidationMessage("Choose or add a location before continuing.");
      return;
    }

    if (step === 0 && locationEditorMode !== "closed") {
      setValidationMessage("Save or cancel the location edit before continuing.");
      return;
    }

    if (step === 1 && !hasScheduleDay) {
      setValidationMessage("Choose a day so cleaners know when to bid.");
      return;
    }

    if (step === 1 && !hasScheduleArrival) {
      setValidationMessage("Choose ASAP or an arrival window to continue.");
      return;
    }

    setValidationMessage("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.setTimeout(() => {
      wizardTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function goBack() {
    setValidationMessage("");
    setStep((current) => Math.max(current - 1, 0));
    window.setTimeout(() => {
      wizardTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function chooseToday() {
    setDayChoice("today");
    setRequestedDate(todayValue);
    setValidationMessage("");
  }

  function chooseAnotherDay() {
    setDayChoice("another");
    setRequestedDate("");
    setValidationMessage("");
  }

  function chooseAsap() {
    setArrivalChoice("asap");
    setTimingPreference(TimingPreference.ASAP);
    setStartHour("");
    setEndHour("");
    setValidationMessage("");
  }

  function chooseTimeSlot() {
    setArrivalChoice("window");
    setTimingPreference(TimingPreference.TIME_SLOT);
    setValidationMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (step < steps.length - 1 || !submitIntentRef.current) {
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
      <div ref={wizardTopRef} className="market-form-heading">
        <h1>Post A Job</h1>
      </div>

      <div className="market-wizard-progress">
        {steps.map((label, index) => {
          const className = [
            "market-wizard-progress__step",
            index === step ? "active" : "",
            index < step ? "complete" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={label} className={className}>
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </div>
          );
        })}
      </div>

      {step === 0 ? (
        <section className="market-form-section market-question-flow">
          <div className="market-section-heading">
            <h2>1. Job details</h2>
          </div>

          <section className="market-question-block stack">
            <div className="market-question-copy">
              <h3>Where should cleaners go?</h3>
            </div>

            {selectedHomeProfile ? (
              <div className="market-preset-card market-location-card">
                <div className="market-preset-card__row">
                  <span className="market-preset-card__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7" /><path d="M9 22V12h6v10" />
                    </svg>
                  </span>
                  <div className="stack small">
                    <span className="market-card__meta">{selectedHomeProfile.label}</span>
                    <strong>{addressLine1}, {city}, {state} {postalCode}</strong>
                  </div>
                  <button type="button" className="market-inline-edit" onClick={openEditLocation}>
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="notice">
                Add a home preset here, then keep posting this job.
              </div>
            )}

            {locationEditorMode !== "closed" ? (
              <LocationEditor
                draft={locationDraft}
                mode={locationEditorMode}
                presets={savedHomeProfiles}
                isSaving={isSavingLocation}
                message={locationSaveMessage}
                onCancel={selectedHomeProfile ? cancelLocationEdit : undefined}
                onChange={updateLocationDraft}
                onPresetSelect={choosePresetForEdit}
                onSave={saveLocation}
              />
            ) : null}

            <button type="button" className="market-new-location-button" onClick={openNewLocation}>
              <span aria-hidden="true">+</span>
              New Location
            </button>
          </section>

          {hasAddress ? (
            <section className="market-question-block stack">
              <div className="field">
                <label htmlFor="notes">Notes for cleaners</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Any notes, areas to focus on, or specific clean up items?"
                />
              </div>
            </section>
          ) : null}
        </section>
      ) : null}

      {step === 1 ? (
        <section className="market-form-section market-question-flow">
          <div className="market-section-heading">
            <h2>2. When would you like to schedule?</h2>
          </div>

          <section className="market-question-block stack">
            <div className="market-question-copy">
              <span>Choose a day:</span>
            </div>
            <div className="market-segmented">
              <label className={dayChoice === "today" ? "market-segmented__option active" : "market-segmented__option"}>
                <input
                  type="radio"
                  value="today"
                  checked={dayChoice === "today"}
                  onChange={chooseToday}
                />
                Today
              </label>
              <label className={dayChoice === "another" ? "market-segmented__option active" : "market-segmented__option"}>
                <input
                  type="radio"
                  value="another"
                  checked={dayChoice === "another"}
                  onChange={chooseAnotherDay}
                />
                Another day
              </label>
            </div>
          </section>

          {dayChoice === "another" ? (
            <section className="market-question-block stack">
              <div className="market-schedule-label">
                <strong>Choose a day</strong>
                <span>No calendar popup, just tap a date.</span>
              </div>
              <div className="market-schedule-picker">
                <div className="market-date-strip" role="list" aria-label="Available dates">
                  {dateOptions.slice(1).map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      className={requestedDate === option.value ? "market-date-card active" : "market-date-card"}
                      onClick={() => {
                        setRequestedDate(option.value);
                        setValidationMessage("");
                      }}
                      aria-pressed={requestedDate === option.value}
                    >
                      <span>{option.label}</span>
                      <strong>{option.day}</strong>
                      <small>{option.month}</small>
                      <em>{dateHints[index + 1] ?? "Open"}</em>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {hasScheduleDay ? (
            <section className="market-question-block stack">
              <div className="market-schedule-label">
                <strong>Arrival window</strong>
                <span>Choose speed or set a custom window.</span>
              </div>
              <div className="market-segmented">
                <label className={arrivalChoice === "asap" ? "market-segmented__option active" : "market-segmented__option"}>
                  <input
                    type="radio"
                    value="asap"
                    checked={arrivalChoice === "asap"}
                    onChange={chooseAsap}
                  />
                  ASAP
                </label>
                <label className={arrivalChoice === "window" ? "market-segmented__option active" : "market-segmented__option"}>
                  <input
                    type="radio"
                    value="window"
                    checked={arrivalChoice === "window"}
                    onChange={chooseTimeSlot}
                  />
                  Create a schedule
                </label>
              </div>

              {arrivalChoice === "window" ? (
                <div className="market-custom-window">
                  <div className="market-time-slot">
                    <span className="market-time-slot__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    </span>
                    <label className="market-time-slot__copy" htmlFor="startHour">
                      <span>Arrival time</span>
                      {startHour ? <span className="market-time-slot__display">{startHour}</span> : null}
                    </label>
                    <select
                      id="startHour"
                      value={startHour}
                      onChange={(event) => {
                        setStartHour(event.target.value);
                        setArrivalChoice("window");
                        setTimingPreference(TimingPreference.TIME_SLOT);
                        setValidationMessage("");
                      }}
                    >
                      <option value="">--:--</option>
                      {hourOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="market-time-slot__period">
                      <button
                        type="button"
                        className={startPeriod === "AM" ? "active" : ""}
                        onClick={() => setStartPeriod("AM")}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        className={startPeriod === "PM" ? "active" : ""}
                        onClick={() => setStartPeriod("PM")}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                  <div className="market-time-slot">
                    <span className="market-time-slot__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    </span>
                    <label className="market-time-slot__copy" htmlFor="endHour">
                      <span>Finish time</span>
                      {endHour ? <span className="market-time-slot__display">{endHour}</span> : null}
                    </label>
                    <select
                      id="endHour"
                      value={endHour}
                      onChange={(event) => {
                        setEndHour(event.target.value);
                        setArrivalChoice("window");
                        setTimingPreference(TimingPreference.TIME_SLOT);
                        setValidationMessage("");
                      }}
                    >
                      <option value="">--:--</option>
                      {hourOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="market-time-slot__period">
                      <button
                        type="button"
                        className={endPeriod === "AM" ? "active" : ""}
                        onClick={() => setEndPeriod("AM")}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        className={endPeriod === "PM" ? "active" : ""}
                        onClick={() => setEndPeriod("PM")}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {canContinueFromSchedule ? (
                <div className="market-schedule-summary" aria-live="polite">
                  <span>Selected</span>
                  <strong>
                    {arrivalChoice === "asap"
                      ? `${formatDateForReview(requestedDate)} · ASAP`
                      : `${formatDateForReview(requestedDate)} · ${selectedWindow}`}
                  </strong>
                </div>
              ) : null}
              {validationMessage ? (
                <p className="market-form-error" aria-live="polite">{validationMessage}</p>
              ) : null}
            </section>
          ) : null}

          {canContinueFromSchedule ? (
            <section className="market-question-block stack">
              <div className="field">
                <label htmlFor="entryMethod">How will the cleaners enter</label>
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
        </section>
      ) : null}

      {step === 2 ? (
        <section className="market-form-section stack">
          <div className="market-section-heading">
            <h2>Review</h2>
          </div>

          <article className="market-card">
            <div className="stack small">
              <strong>{addressLine1}, {city}, {state} {postalCode}</strong>
              <span className="market-card__meta">Whole-home clean</span>
              <span className="market-card__meta">{entryMethodOptions.find((option) => option.value === entryMethod)?.label ?? entryMethod}</span>
              <span className="market-card__meta">
                {timingPreference === TimingPreference.ASAP
                  ? "ASAP request"
                  : `${formatDateForReview(requestedDate) || "Choose a date"} · ${selectedWindow ?? "Choose an arrival window"}`}
              </span>
            </div>
          </article>

          {notes ? <div className="notice">{notes}</div> : null}

          <div className="notice">
            Cleaners will submit their own prices. You choose which bid to accept.
          </div>
        </section>
      ) : null}

      <input type="hidden" name="homeProfileId" value={isUsingPreset ? selectedHomeProfile?.id ?? "" : ""} />
      <input type="hidden" name="addressLine1" value={addressLine1} />
      <input type="hidden" name="addressLine2" value={addressLine2} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="postalCode" value={postalCode} />
      <input type="hidden" name="entryMethod" value={entryMethod} />
      <input type="hidden" name="entryNotes" value={entryNotes} />
      <input type="hidden" name="cleanLevel" value={cleanLevel} />
      <input type="hidden" name="roomCleanLevels" value={JSON.stringify(roomCleanLevels)} />
      <input type="hidden" name="timingPreference" value={timingPreference} />
      <input type="hidden" name="requestedDate" value={requestedDate} />
      <input type="hidden" name="requestedWindowStart" value={windowStartTime} />
      <input type="hidden" name="requestedWindowEnd" value={windowEndTime} />
      <input type="hidden" name="notes" value={notes} />
      {roomTypes.map((roomType) => (
        <input key={roomType} type="hidden" name="roomTypes" value={roomType} />
      ))}
      {serviceNeeds.map((serviceNeed) => (
        <input key={serviceNeed} type="hidden" name="serviceNeeds" value={serviceNeed} />
      ))}

      {validationMessage && step !== 1 ? (
        <p className="market-form-error market-form-error--footer" aria-live="polite">
          {validationMessage}
        </p>
      ) : null}

      <div className={step > 0 ? "market-wizard-actions" : "market-wizard-actions market-wizard-actions--first"}>
        <div className="market-wizard-actions__row">
          {step > 0 ? (
            <button type="button" className="button secondary" onClick={goBack}>
              Back
            </button>
          ) : null}
          {step < steps.length - 1 ? (
            <PulsatingPrimaryButton type="button" className="flex-1" onClick={goNext}>
              Continue
            </PulsatingPrimaryButton>
          ) : (
            <PulsatingPrimaryButton
              type="submit"
              className="flex-1"
              onClick={() => {
                submitIntentRef.current = true;
              }}
              disabled={
                timingPreference === TimingPreference.TIME_SLOT &&
                (!requestedDate || !windowStartTime || !windowEndTime)
              }
            >
              Post Job for Bids
            </PulsatingPrimaryButton>
          )}
        </div>
        <Link href="/customer" className="market-cancel-link">
          Cancel
        </Link>
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

function getLocationDraft(profile: WizardHomeProfile | null): LocationDraft {
  return {
    label: profile?.label ?? "Home",
    addressLine1: profile?.addressLine1 ?? "",
    addressLine2: profile?.addressLine2 ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "New York",
    postalCode: profile?.postalCode ?? "",
    bedroomCount: profile?.bedroomCount ?? null,
    bathroomCount: profile?.bathroomCount ?? null,
    estimatedSquareFeet: profile?.estimatedSquareFeet ?? null,
    storyCount: profile?.storyCount ?? null,
    hasPets: profile?.hasPets ?? false,
  };
}

function validateLocationDraft(draft: LocationDraft) {
  if (!draft.addressLine1.trim()) return "Enter the street address.";
  if (!draft.city.trim()) return "Enter the city.";
  if (!draft.state.trim()) return "Enter the state.";
  if (!draft.postalCode.trim()) return "Enter the ZIP code.";
  return "";
}

function LocationEditor({
  draft,
  isSaving,
  message,
  mode,
  onCancel,
  onChange,
  onPresetSelect,
  onSave,
  presets,
}: {
  draft: LocationDraft;
  isSaving: boolean;
  message: string;
  mode: LocationEditorMode;
  onCancel?: () => void;
  onChange: <K extends keyof LocationDraft>(field: K, value: LocationDraft[K]) => void;
  onPresetSelect: (profile: WizardHomeProfile) => void;
  onSave: () => void;
  presets: WizardHomeProfile[];
}) {
  const idPrefix = mode === "new" ? "newLocation" : "editLocation";
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);

  return (
    <div className="market-location-editor stack">
      <div className="field">
        <label htmlFor={`${idPrefix}Label`}>Preset name</label>
        {mode === "edit" && presets.length > 0 ? (
          <div className="market-preset-combobox">
            <button
              id={`${idPrefix}Label`}
              type="button"
              className="market-preset-combobox__trigger"
              onClick={() => setIsPresetMenuOpen((current) => !current)}
              aria-expanded={isPresetMenuOpen}
              aria-haspopup="listbox"
            >
              <span>{draft.label || "Choose a preset"}</span>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m5 7 5 5 5-5" />
              </svg>
            </button>
            {isPresetMenuOpen ? (
              <div className="market-preset-combobox__menu" role="listbox">
                {presets.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    className={profile.label === draft.label ? "active" : ""}
                    onClick={() => {
                      onPresetSelect(profile);
                      setIsPresetMenuOpen(false);
                    }}
                    role="option"
                    aria-selected={profile.label === draft.label}
                  >
                    <strong>{profile.label}</strong>
                    <span>
                      {profile.addressLine1}, {profile.city}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <input
            id={`${idPrefix}Label`}
            value={draft.label}
            onChange={(event) => onChange("label", event.target.value)}
            placeholder="Home"
          />
        )}
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}AddressLine1`}>Street address</label>
        <input
          id={`${idPrefix}AddressLine1`}
          value={draft.addressLine1}
          onChange={(event) => onChange("addressLine1", event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}AddressLine2`}>Apartment or suite</label>
        <input
          id={`${idPrefix}AddressLine2`}
          value={draft.addressLine2}
          onChange={(event) => onChange("addressLine2", event.target.value)}
        />
      </div>
      <div className="grid two">
        <div className="field">
          <label htmlFor={`${idPrefix}City`}>City</label>
          <input
            id={`${idPrefix}City`}
            value={draft.city}
            onChange={(event) => onChange("city", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}State`}>State</label>
          <input
            id={`${idPrefix}State`}
            value={draft.state}
            onChange={(event) => onChange("state", event.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}PostalCode`}>ZIP code</label>
        <input
          id={`${idPrefix}PostalCode`}
          value={draft.postalCode}
          onChange={(event) => onChange("postalCode", event.target.value)}
          inputMode="numeric"
        />
      </div>
      <div className="market-home-details-grid">
        <div className="field">
          <label htmlFor={`${idPrefix}BedroomCount`}>Bedrooms</label>
          <input
            id={`${idPrefix}BedroomCount`}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={draft.bedroomCount ?? ""}
            onChange={(event) =>
              onChange(
                "bedroomCount",
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
            placeholder="0"
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}BathroomCount`}>Bathrooms</label>
          <input
            id={`${idPrefix}BathroomCount`}
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={draft.bathroomCount ?? ""}
            onChange={(event) =>
              onChange(
                "bathroomCount",
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
            placeholder="1"
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}EstimatedSquareFeet`}>Square feet</label>
          <input
            id={`${idPrefix}EstimatedSquareFeet`}
            type="number"
            min="1"
            step="50"
            inputMode="numeric"
            value={draft.estimatedSquareFeet ?? ""}
            onChange={(event) =>
              onChange(
                "estimatedSquareFeet",
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
            placeholder="1100"
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}StoryCount`}>Stories</label>
          <input
            id={`${idPrefix}StoryCount`}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={draft.storyCount ?? ""}
            onChange={(event) =>
              onChange(
                "storyCount",
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
            placeholder="1"
          />
        </div>
      </div>
      <div className="field">
        <span className="field-label">Pets</span>
        <div className="market-pet-toggle">
          <button
            type="button"
            className={!draft.hasPets ? "active" : ""}
            onClick={() => onChange("hasPets", false)}
          >
            No
          </button>
          <button
            type="button"
            className={draft.hasPets ? "active" : ""}
            onClick={() => onChange("hasPets", true)}
          >
            Yes
          </button>
        </div>
      </div>
      {message ? <p className="market-form-error">{message}</p> : null}
      <div className="market-location-editor__actions">
        {onCancel ? (
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="button" className="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving..." : mode === "new" ? "Use this location" : "Save location"}
        </button>
      </div>
    </div>
  );
}

function formatTime(time: string) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getDateOptions() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
  });
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  });
  const today = new Date();

  return Array.from({ length: 8 }, (_, index) => {
    const date = addDays(today, index);
    return {
      value: toDateInputValue(date),
      label: index === 0 ? "Today" : index === 1 ? "Tomorrow" : dayFormatter.format(date),
      day: String(date.getDate()),
      month: formatter.format(date),
    };
  });
}

function getHourOptions() {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 12; h++) {
    for (const m of [0, 30]) {
      const display = h === 0 ? 12 : h;
      const label = m === 0 ? `${display}:00` : `${display}:30`;
      options.push({ value: label, label });
    }
  }
  return options;
}

function to24h(hour12: string, period: "AM" | "PM"): string {
  const [hStr, mStr] = hour12.split(":");
  let h = Number(hStr);
  if (h === 12) h = 0;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${mStr}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForReview(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = toDateInputValue(new Date());
  const tomorrow = toDateInputValue(addDays(new Date(), 1));
  const prefix = value === today ? "Today" : value === tomorrow ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short" });
  return `${prefix}, ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function getWindowLabel(start: string, end: string) {
  if (!start || !end) return null;
  if (start === "08:00" && end === "20:00") return "Anytime, 8 AM - 8 PM";
  return `${formatTime(start)} - ${formatTime(end)}`;
}
