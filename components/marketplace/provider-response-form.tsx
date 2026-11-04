"use client";
import { useState, type FormEvent } from "react";
import type { TimingPreference } from "@prisma/client";
export function ProviderResponseForm({
  token,
  jobRevision,
  requestedDate,
  requestedTime,
  initial,
}: {
  token: string;
  jobRevision?: number;
  timingPreference: TimingPreference;
  requestedDate: string | null;
  requestedTime: string | null;
  initial?: {
    price?: number | null;
    date?: string | null;
    time?: string | null;
    note?: string | null;
  };
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = e.currentTarget;
    try {
      const r = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
      });
      if (r.redirected) {
        const url = new URL(r.url);
        if (url.searchParams.has("error")) {
          setError(url.searchParams.get("error")!);
          setBusy(false);
          return;
        }
        location.assign(r.url);
        return;
      }
      throw new Error("Unable to send. Try again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check your connection.");
      setBusy(false);
    }
  }
  return (
    <form
      className="effortless-form"
      action={`/invite/cleaner/${token}/offer`}
      method="post"
      onSubmit={submit}
    >
      {jobRevision !== undefined && (
        <input type="hidden" name="jobRevision" value={jobRevision} />
      )}
      <label>
        Total price
        <input
          name="price"
          type="number"
          min="0.01"
          max="10000"
          step="0.01"
          inputMode="decimal"
          required
          defaultValue={initial?.price ?? ""}
          placeholder="$"
        />
      </label>
      <div className="effortless-grid">
        <label>
          Earliest date
          <input
            name="availableDate"
            type="date"
            required
            defaultValue={initial?.date ?? requestedDate ?? ""}
          />
        </label>
        <label>
          Arrival time
          <input
            name="arrivalTime"
            type="time"
            required
            defaultValue={initial?.time ?? requestedTime ?? ""}
          />
        </label>
      </div>
      <small>
        Use the requested schedule if it works, or suggest your next available
        time.
      </small>
      <details>
        <summary>Add a note</summary>
        <label>
          Anything to know?
          <textarea
            name="message"
            maxLength={350}
            defaultValue={initial?.note ?? ""}
          />
        </label>
      </details>
      {error && (
        <p role="alert" className="effortless-error">
          {error}
        </p>
      )}
      <button className="effortless-primary" disabled={busy}>
        {busy ? "Sending…" : "Send bid"}
      </button>
      <small>No account needed. We’ll email you if you’re selected.</small>
    </form>
  );
}
