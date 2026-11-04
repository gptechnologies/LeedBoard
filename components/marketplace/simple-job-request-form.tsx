"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import Link from "next/link";
import type { HomeDetails } from "@/lib/homeowner-view";
import { jobTiming } from "@/lib/homeowner-view";
import { useHomeownerDraft, useHomeownerOwner } from "./homeowner-shell";
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
  const initial = {
    postalCode: source?.postalCode ?? home?.postalCode ?? "",
    bedroomCount: String(source?.bedroomCount ?? home?.bedroomCount ?? ""),
    bathroomCount: String(source?.bathroomCount ?? home?.bathroomCount ?? ""),
    timingPreference: source?.timingPreference ?? "ASAP",
    requestedDate:
      edit && source?.requestedDate
        ? new Date(source.requestedDate).toISOString().slice(0, 10)
        : "",
    requestedWindowStart: source?.requestedWindowStart ?? "08:00",
    requestedWindowEnd: source?.requestedWindowEnd ?? "20:00",
    cleanType: source?.cleanType ?? "STANDARD_CLEAN",
    notes: source?.notes ?? home?.notes ?? "",
  };
  const useSavedFacts =
    !!home?.id &&
    home.bedroomCount !== null &&
    home.bathroomCount !== null &&
    !source;
  const [draft, setDraft] = useState(initial);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const owner = useHomeownerOwner();
  const storageKey = `hk-job:${owner}:${edit?.id ?? "new"}`;
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) setDraft(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, [storageKey]);
  useEffect(() => {
    if (loaded) sessionStorage.setItem(storageKey, JSON.stringify(draft));
  }, [loaded, draft, storageKey]);
  const dirty = JSON.stringify(initial) !== JSON.stringify(draft);
  useHomeownerDraft("job-form", dirty, () => {
    sessionStorage.removeItem(storageKey);
    onDiscard();
  });
  useEffect(() => setKey(crypto.randomUUID()), []);
  function update(name: string, value: string) {
    setDraft((d) => ({ ...d, [name]: value }));
    setError("");
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      f.set("postingKey", key);
      if (home?.id && !source) f.set("homeProfileId", home.id);
      if (edit) f.set("revision", String(edit.revision));
      const r = await fetch(
        edit ? `/customer/jobs/${edit.id}/update` : "/customer/jobs/create",
        { method: "POST", headers: { "X-Well-Kept-Client": "1" }, body: f },
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      sessionStorage.removeItem(storageKey);
      onSaved();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="hk-job-form hk-expand"
      data-dirty={dirty}
      onSubmit={submit}
    >
      {home?.addressLine1 && !source ? (
        <div className="hk-saved-home">
          <strong>{home.addressLine1}</strong>
          <span>
            {home.bedroomCount ?? "—"} beds · {home.bathroomCount ?? "—"} baths
          </span>
        </div>
      ) : null}
      <div className="hk-form-grid">
        <label className="hk-field">
          ZIP code
          <input
            name="postalCode"
            required
            pattern="[0-9]{5}"
            maxLength={5}
            inputMode="numeric"
            autoComplete="postal-code"
            value={draft.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
          />
        </label>
        <label className="hk-field">
          Cleaning
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
      </div>
      {!useSavedFacts && (
        <div className="hk-form-grid">
          {(["bedroomCount", "bathroomCount"] as const).map((name) => (
            <label className="hk-field" key={name}>
              {name === "bedroomCount" ? "Bedrooms" : "Bathrooms"}
              <select
                name={name}
                value={draft[name]}
                required
                onChange={(e) => update(name, e.target.value)}
              >
                <option value="">Choose</option>
                {(name === "bedroomCount"
                  ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                  : [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8]
                ).map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "Studio" : n}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      {useSavedFacts && (
        <>
          <input type="hidden" name="bedroomCount" value={draft.bedroomCount} />
          <input
            type="hidden"
            name="bathroomCount"
            value={draft.bathroomCount}
          />
        </>
      )}
      <label className="hk-field">
        When?
        <select
          name="timingPreference"
          value={draft.timingPreference}
          onChange={(e) => update("timingPreference", e.target.value)}
        >
          <option value="ASAP">First available</option>
          <option value="TIME_SLOT">Choose a date</option>
        </select>
      </label>
      {draft.timingPreference === "TIME_SLOT" && (
        <>
          <label className="hk-field">
            Cleaning date
            <input
              type="date"
              name="requestedDate"
              required
              value={draft.requestedDate}
              onChange={(e) => update("requestedDate", e.target.value)}
            />
          </label>
          <div className="hk-form-grid">
            <label className="hk-field">
              Arrive after
              <input
                type="time"
                name="requestedWindowStart"
                value={draft.requestedWindowStart}
                onChange={(e) => update("requestedWindowStart", e.target.value)}
                required
              />
            </label>
            <label className="hk-field">
              Arrive before
              <input
                type="time"
                name="requestedWindowEnd"
                value={draft.requestedWindowEnd}
                onChange={(e) => update("requestedWindowEnd", e.target.value)}
                required
              />
            </label>
          </div>
        </>
      )}
      <details>
        <summary>
          Cleaning instructions <small>Optional</small>
        </summary>
        <label className="hk-field">
          <span className="sr-only">Cleaning instructions</span>
          <textarea
            name="notes"
            value={draft.notes}
            onChange={(e) => update("notes", e.target.value)}
            maxLength={500}
            placeholder="Focus areas or special requests"
          />
        </label>
      </details>
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
      <p className="hk-request-summary">
        {draft.bedroomCount || "—"} bed · {draft.bathroomCount || "—"} bath ·{" "}
        {jobTiming({ ...draft, requestedDate: draft.requestedDate || null })}
      </p>
      {edit && (
        <small className="hk-muted">
          Changing the request asks cleaners to update their bids.
        </small>
      )}
      <button type="submit" className="hk-primary" disabled={busy || !key}>
        <Send />
        {busy
          ? "Saving…"
          : edit
            ? "Save job details"
            : "Send request to cleaners"}
      </button>
      <small className="hk-muted">
        Your address and contact details stay private until you choose.
      </small>
    </form>
  );
}
