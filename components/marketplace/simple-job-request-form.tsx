"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { HomeDetails } from "@/lib/homeowner-view";
import {
  discardChanges,
  useHomeownerDraft,
  useHomeownerOwner,
} from "./homeowner-shell";
export type JobDraft = {
  postalCode: string;
  bedroomCount: number | null;
  bathroomCount: number | null;
  timingPreference: string;
  requestedDate: Date | string | null;
  requestedWindowStart: string | null;
  requestedWindowEnd: string | null;
  cleanType: string | null;
  notes: string | null;
};
export type RepostSource = JobDraft;
const windows = [
  { id: "anytime", label: "Anytime that day", start: "08:00", end: "20:00" },
  {
    id: "morning",
    label: "Morning · 8 AM–12 PM",
    start: "08:00",
    end: "12:00",
  },
  {
    id: "afternoon",
    label: "Afternoon · 12 PM–5 PM",
    start: "12:00",
    end: "17:00",
  },
];
function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function SimpleJobRequestForm({
  home,
  source,
  onSaved,
  onDiscard,
  edit,
}: {
  home?: HomeDetails | null;
  source?: JobDraft | null;
  onSaved: () => void;
  onDiscard: () => void;
  edit?: { id: string; revision: number };
}) {
  const router = useRouter();
  const [initial] = useState(() => ({
    postalCode: source?.postalCode ?? home?.postalCode ?? "",
    bedroomCount: String(source?.bedroomCount ?? home?.bedroomCount ?? ""),
    bathroomCount: String(source?.bathroomCount ?? home?.bathroomCount ?? ""),
    timingPreference: "TIME_SLOT",
    requestedDate:
      edit && source?.requestedDate
        ? new Date(source.requestedDate).toISOString().slice(0, 10)
        : "",
    requestedWindowStart: source?.requestedWindowStart ?? "08:00",
    requestedWindowEnd: source?.requestedWindowEnd ?? "20:00",
    cleanType: source?.cleanType ?? "STANDARD_CLEAN",
    notes: source?.notes ?? home?.notes ?? "",
  }));
  const [draft, setDraft] = useState(initial);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [custom, setCustom] = useState(
    () =>
      !windows.some(
        (w) =>
          w.start === initial.requestedWindowStart &&
          w.end === initial.requestedWindowEnd,
      ),
  );
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const owner = useHomeownerOwner();
  const storageKey = `hk-job:${owner}:${edit?.id ?? "new"}`;
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const restored = {
          ...initial,
          ...JSON.parse(saved),
          timingPreference: "TIME_SLOT",
        };
        setDraft(restored);
        setCustom(
          !windows.some(
            (w) =>
              w.start === restored.requestedWindowStart &&
              w.end === restored.requestedWindowEnd,
          ),
        );
      }
    } catch {}
    setLoaded(true);
  }, [storageKey, initial]);
  useEffect(() => {
    if (loaded) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {}
    }
  }, [loaded, draft, storageKey]);
  const dirty = JSON.stringify(initial) !== JSON.stringify(draft);
  function discard() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
    onDiscard();
  }
  useHomeownerDraft("job-form", dirty, discard);
  useEffect(() => setKey(crypto.randomUUID()), []);
  function update(name: keyof typeof initial, value: string) {
    setDraft((d) => ({ ...d, [name]: value }));
    setError("");
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return;
    setError("");
    if (
      !/^\d{5}$/.test(draft.postalCode) ||
      !draft.requestedDate ||
      draft.requestedDate < localDate()
    ) {
      if (!formRef.current?.reportValidity()) return;
      setError("Choose a date today or later.");
      return;
    }
    if (
      !draft.requestedWindowStart ||
      !draft.requestedWindowEnd ||
      draft.requestedWindowEnd <= draft.requestedWindowStart
    ) {
      setError("Latest arrival must be later than earliest arrival.");
      return;
    }
    if (!draft.bedroomCount || !draft.bathroomCount || !draft.cleanType) {
      setDetailsOpen(true);
      setError(
        "Choose bedrooms and bathrooms so cleaners can give an accurate bid.",
      );
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLSelectElement>(
            `[name="${!draft.bedroomCount ? "bedroomCount" : "bathroomCount"}"]`,
          )
          ?.focus(),
      );
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const f = new FormData();
      Object.entries(draft).forEach(([name, value]) => f.set(name, value));
      f.set("timingPreference", "TIME_SLOT");
      f.set("postingKey", key);
      if (home?.id && !source) f.set("homeProfileId", home.id);
      if (edit) f.set("revision", String(edit.revision));
      const r = await fetch(
        edit ? `/customer/jobs/${edit.id}/update` : "/customer/jobs/create",
        {
          method: "POST",
          headers: { "X-Well-Kept-Client": "1" },
          body: f,
        },
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unable to save. Try again.");
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      onSaved();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save. Try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  const readableDate = draft.requestedDate
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date(`${draft.requestedDate}T12:00:00`))
    : "Choose a date";
  const needsDetails = !draft.bedroomCount || !draft.bathroomCount;
  return (
    <form
      ref={formRef}
      className="hk-job-form hk-request-form"
      data-dirty={dirty}
      onSubmit={submit}
      noValidate
      aria-busy={busy}
    >
      {!edit && (
        <header className="hk-request-heading">
          <h1>Post a cleaning job</h1>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (discardChanges(dirty)) discard();
            }}
          >
            Cancel
          </button>
        </header>
      )}
      <fieldset disabled={busy} className="hk-request-fields">
        <section className="hk-request-section" aria-labelledby="request-where">
          <MapPin aria-hidden="true" />
          <div className="hk-request-section-body">
            <h2 id="request-where">Where</h2>
            <label className="hk-field">
              <span className="sr-only">ZIP code</span>
              <input
                name="postalCode"
                required
                pattern="[0-9]{5}"
                maxLength={5}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="ZIP code"
                value={draft.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
              />
            </label>
          </div>
        </section>
        <section className="hk-request-section" aria-labelledby="request-when">
          <CalendarDays aria-hidden="true" />
          <div className="hk-request-section-body">
            <h2 id="request-when">When</h2>
            <label className="hk-request-date">
              <CalendarDays aria-hidden="true" />
              <span>{readableDate}</span>
              <ChevronDown aria-hidden="true" />
              <input
                aria-label="Cleaning date"
                type="date"
                name="requestedDate"
                required
                min={localDate()}
                value={draft.requestedDate}
                onChange={(e) => update("requestedDate", e.target.value)}
              />
            </label>
            <fieldset className="hk-arrival-options">
              <legend>What time can the cleaner come?</legend>
              {windows.map((w) => (
                <label key={w.id} className="hk-arrival-option">
                  <input
                    type="radio"
                    name="arrivalPreset"
                    value={w.id}
                    checked={
                      !custom &&
                      draft.requestedWindowStart === w.start &&
                      draft.requestedWindowEnd === w.end
                    }
                    onChange={() => {
                      setCustom(false);
                      setDraft((d) => ({
                        ...d,
                        requestedWindowStart: w.start,
                        requestedWindowEnd: w.end,
                      }));
                      setError("");
                    }}
                  />
                  <span>{w.label}</span>
                </label>
              ))}
            </fieldset>
            <button
              type="button"
              className="hk-custom-time-toggle"
              aria-expanded={custom}
              aria-controls="request-custom-time"
              onClick={() => {
                setCustom((c) => !c);
                setError("");
                if (custom)
                  setDraft((d) => ({
                    ...d,
                    requestedWindowStart: "08:00",
                    requestedWindowEnd: "20:00",
                  }));
              }}
            >
              Choose a different time
            </button>
            <div
              id="request-custom-time"
              className="hk-inline-disclosure"
              data-open={custom}
              inert={!custom}
            >
              <div>
                <div className="hk-form-grid hk-custom-time-fields">
                  <label className="hk-field">
                    Earliest arrival
                    <input
                      type="time"
                      name="requestedWindowStart"
                      value={draft.requestedWindowStart}
                      onChange={(e) =>
                        update("requestedWindowStart", e.target.value)
                      }
                    />
                  </label>
                  <label className="hk-field">
                    Latest arrival
                    <input
                      type="time"
                      name="requestedWindowEnd"
                      value={draft.requestedWindowEnd}
                      onChange={(e) =>
                        update("requestedWindowEnd", e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="hk-request-details">
          <button
            type="button"
            className="hk-details-toggle"
            aria-expanded={detailsOpen}
            aria-controls="request-details"
            onClick={() => setDetailsOpen((o) => !o)}
          >
            <Sparkles aria-hidden="true" />
            <span>Add cleaning details</span>
            <small>{needsDetails ? "Required" : "Optional"}</small>
            <ChevronDown aria-hidden="true" />
          </button>
          <div
            id="request-details"
            className="hk-inline-disclosure"
            data-open={detailsOpen}
            inert={!detailsOpen}
          >
            <div>
              <div className="hk-details-fields">
                {needsDetails && (
                  <p className="hk-muted">
                    Add bedrooms and bathrooms for an accurate bid.
                  </p>
                )}
                <label className="hk-field">
                  Cleaning type
                  <select
                    name="cleanType"
                    value={draft.cleanType}
                    onChange={(e) => update("cleanType", e.target.value)}
                  >
                    <option value="STANDARD_CLEAN">Standard clean</option>
                    <option value="DEEP_CLEAN">Deep clean</option>
                    <option value="MOVE_OUT_CLEAN">Move-out clean</option>
                  </select>
                </label>
                <div className="hk-form-grid">
                  {(["bedroomCount", "bathroomCount"] as const).map((name) => (
                    <label className="hk-field" key={name}>
                      {name === "bedroomCount" ? "Bedrooms" : "Bathrooms"}
                      <select
                        name={name}
                        value={draft[name]}
                        onChange={(e) => update(name, e.target.value)}
                      >
                        <option value="">Choose</option>
                        {(name === "bedroomCount"
                          ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                          : [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8]
                        ).map((n) => (
                          <option key={n} value={n}>
                            {name === "bedroomCount" && n === 0 ? "Studio" : n}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <label className="hk-field">
                  Cleaning notes and special requests
                  <textarea
                    name="notes"
                    rows={3}
                    value={draft.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    maxLength={500}
                    placeholder="Anything cleaners should know?"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
        {error && (
          <p className="hk-error" role="alert">
            {error}
          </p>
        )}
        {error.includes("session") && (
          <Link
            className="hk-text-button"
            href="/login?returnTo=%2Fcustomer%3Fcompose%3D1"
            data-preserve-draft="true"
          >
            Sign in again
          </Link>
        )}
        {edit && (
          <small className="hk-muted">
            Changing the request asks cleaners to update their bids.
          </small>
        )}
        <button
          type="submit"
          className="hk-primary hk-request-submit"
          disabled={busy || !key}
        >
          <Send aria-hidden="true" />
          {busy
            ? "Sending…"
            : edit
              ? "Save job details"
              : "Send request to cleaners"}
        </button>
      </fieldset>
    </form>
  );
}
