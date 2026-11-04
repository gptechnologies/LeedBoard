"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
export type RepostSource = Record<string, unknown>;
export function SimpleJobRequestForm({
  homeProfiles,
}: {
  homeProfiles: Array<{
    postalCode: string;
    bedroomCount?: number | null;
    bathroomCount?: number | null;
  }>;
  repostSource?: unknown;
}) {
  const [draft, setDraft] = useState({
    postalCode: homeProfiles[0]?.postalCode ?? "",
    bedroomCount: homeProfiles[0]?.bedroomCount?.toString() ?? "",
    bathroomCount: homeProfiles[0]?.bathroomCount?.toString() ?? "",
    timingPreference: "ASAP",
    requestedDate: "",
    requestedWindowStart: "08:00",
    requestedWindowEnd: "20:00",
    cleanType: "STANDARD_CLEAN",
  });
  const [ready, setReady] = useState(false);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wk-quick-post");
      if (saved) setDraft((d) => ({ ...d, ...JSON.parse(saved) }));
    } catch {}
    setKey(crypto.randomUUID());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("wk-quick-post", JSON.stringify(draft));
  }, [draft, ready]);
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
      const r = await fetch("/customer/jobs/create", {
        method: "POST",
        headers: { "X-Well-Kept-Client": "1" },
        body: f,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      localStorage.setItem(
        "wk-quick-post",
        JSON.stringify({ ...draft, requestedDate: "" }),
      );
      location.assign("/customer?posted=1#job-" + data.jobId);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Check your connection and try again.",
      );
      setBusy(false);
    }
  }
  return (
    <form className="effortless-form" onSubmit={submit}>
      <header>
        <p className="effortless-kicker">A little help for your home</p>
        <h1>Find your cleaner.</h1>
        <p>Post once. Compare total prices and availability here.</p>
      </header>
      <label>
        ZIP code
        <input
          autoComplete="postal-code"
          inputMode="numeric"
          name="postalCode"
          pattern="[0-9]{5}"
          maxLength={5}
          required
          value={draft.postalCode}
          onChange={(e) => update("postalCode", e.target.value)}
          placeholder="Your service ZIP"
        />
      </label>
      <div className="effortless-grid">
        {(["bedroomCount", "bathroomCount"] as const).map((name) => (
          <label key={name}>
            {name === "bedroomCount" ? "Bedrooms" : "Bathrooms"}
            <select
              name={name}
              required
              value={draft[name]}
              onChange={(e) => update(name, e.target.value)}
            >
              <option value="">Choose</option>
              {(name === "bedroomCount"
                ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                : [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8]
              ).map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Studio" : n}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label>
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
          <label>
            Date
            <input
              type="date"
              name="requestedDate"
              required
              value={draft.requestedDate}
              onChange={(e) => update("requestedDate", e.target.value)}
            />
          </label>
          <div className="effortless-grid">
            <label>
              Arrive after
              <input
                type="time"
                name="requestedWindowStart"
                required
                value={draft.requestedWindowStart}
                onChange={(e) => update("requestedWindowStart", e.target.value)}
              />
            </label>
            <label>
              Arrive before
              <input
                type="time"
                name="requestedWindowEnd"
                required
                value={draft.requestedWindowEnd}
                onChange={(e) => update("requestedWindowEnd", e.target.value)}
              />
            </label>
          </div>
          <small>This is an arrival window, not the cleaning duration.</small>
        </>
      )}
      <label>
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
      <p className="effortless-note">
        Cleaners bring supplies. Your address and contact details stay private
        until you choose a cleaner.
      </p>
      {error && (
        <p role="alert" className="effortless-error">
          {error}{" "}
          {error.includes("session") && (
            <Link href="/login?returnTo=/customer/jobs/new">Sign in again</Link>
          )}
        </p>
      )}
      <button
        className="effortless-primary"
        type="submit"
        disabled={busy || !ready}
        aria-busy={busy}
      >
        {busy ? "Posting…" : "Find cleaners"}
      </button>
      <small>
        By posting, you agree to our <Link href="/terms">Terms</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </small>
    </form>
  );
}
