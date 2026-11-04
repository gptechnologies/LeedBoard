"use client";
import {
  Bath,
  BedDouble,
  House,
  MapPin,
  Minus,
  PawPrint,
  Pencil,
  Plus,
  Save,
  LogOut,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { HomeDetails } from "@/lib/homeowner-view";
import { discardChanges, useHomeownerDraft } from "./homeowner-shell";
export function HomeownerAccountForm({
  home,
  startEditing = false,
}: {
  home: HomeDetails;
  startEditing?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(home);
  const [draft, setDraft] = useState(home);
  const [editing, setEditing] = useState(startEditing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(saved);
  function cancel() {
    setDraft(saved);
    setEditing(false);
    setError("");
  }
  useHomeownerDraft("home", dirty, cancel);
  function set(
    key: keyof HomeDetails,
    value: string | number | boolean | null,
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError("");
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      f.set("homeProfileId", draft.id ?? "");
      f.set("label", draft.label);
      f.set("entryMethod", draft.entryMethod);
      f.set("bedroomCount", String(draft.bedroomCount ?? ""));
      f.set("bathroomCount", String(draft.bathroomCount ?? ""));
      f.set("hasPets", String(draft.hasPets));
      const r = await fetch("/customer/my-home/save", {
        method: "POST",
        headers: { "X-Well-Kept-Client": "1" },
        body: f,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setSaved(data.homeProfile);
      setDraft(data.homeProfile);
      setEditing(false);
      setNotice("Home details saved.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="hk-primary"
        onClick={() => {
          if (editing) {
            if (discardChanges(dirty)) cancel();
          } else {
            setDraft(saved);
            setEditing(true);
            setNotice("");
          }
        }}
        type="button"
      >
        <Pencil />
        {editing
          ? "Cancel editing"
          : saved.id
            ? "Edit home details"
            : "Add home details"}
      </button>
      {notice && !editing && (
        <p className="hk-feedback" role="status">
          {notice}
        </p>
      )}
      {editing ? (
        <form className="hk-home-editor hk-expand" onSubmit={submit}>
          <div className="hk-panel hk-home-fields">
            <label className="hk-field">
              Address
              <div className="hk-input-icon">
                <MapPin />
                <input
                  name="addressLine1"
                  value={draft.addressLine1}
                  onChange={(e) => set("addressLine1", e.target.value)}
                  autoComplete="street-address"
                  placeholder="Street address"
                  required
                />
              </div>
            </label>
            <details
              className="hk-address-details"
              open={!home.id ? true : undefined}
            >
              <summary>
                {draft.city && draft.postalCode
                  ? `${draft.city}, ${draft.state} ${draft.postalCode}`
                  : "City, state & ZIP"}
              </summary>
              <div className="hk-address-extra">
                <label className="hk-field">
                  City
                  <input
                    name="city"
                    value={draft.city}
                    onChange={(e) => set("city", e.target.value)}
                    autoComplete="address-level2"
                    required
                  />
                </label>
                <label className="hk-field">
                  State
                  <input
                    name="state"
                    value={draft.state}
                    onChange={(e) => set("state", e.target.value)}
                    autoComplete="address-level1"
                    required
                  />
                </label>
                <label className="hk-field">
                  ZIP
                  <input
                    name="postalCode"
                    value={draft.postalCode}
                    onChange={(e) => set("postalCode", e.target.value)}
                    autoComplete="postal-code"
                    pattern="[0-9]{5}"
                    inputMode="numeric"
                    required
                  />
                </label>
              </div>
            </details>
            <div className="hk-edit-row">
              <span>Bedrooms</span>
              <Stepper
                label="Bedrooms"
                value={draft.bedroomCount}
                min={0}
                step={1}
                onChange={(v) => set("bedroomCount", v)}
              />
            </div>
            <div className="hk-edit-row">
              <span>Bathrooms</span>
              <Stepper
                label="Bathrooms"
                value={draft.bathroomCount}
                min={0.5}
                step={0.5}
                onChange={(v) => set("bathroomCount", v)}
              />
            </div>
            <label className="hk-edit-row">
              <span>Square feet</span>
              <div className="hk-input-icon hk-small-input">
                <House />
                <input
                  name="estimatedSquareFeet"
                  aria-label="Square feet"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="Optional"
                  value={draft.estimatedSquareFeet ?? ""}
                  onChange={(e) =>
                    set(
                      "estimatedSquareFeet",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </div>
            </label>
            <div className="hk-edit-row">
              <span>Pets</span>
              <div className="hk-segments" role="group" aria-label="Pets">
                {[false, true].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    aria-pressed={draft.hasPets === v}
                    onClick={() => set("hasPets", v)}
                  >
                    {v ? "Pets" : "No pets"}
                  </button>
                ))}
              </div>
            </div>
            <label className="hk-field hk-notes-field">
              Entry notes
              <div className="hk-input-icon">
                <KeyRound />
                <textarea
                  name="entryNotes"
                  maxLength={1000}
                  placeholder="e.g., door code, key location"
                  value={draft.entryNotes ?? ""}
                  onChange={(e) => set("entryNotes", e.target.value)}
                />
              </div>
              <small>Private until you choose a cleaner.</small>
            </label>
            <label className="hk-field hk-notes-field">
              Cleaning notes
              <div className="hk-input-icon">
                <Sparkles />
                <textarea
                  name="notes"
                  maxLength={1000}
                  placeholder="e.g., focus areas, special requests"
                  value={draft.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </label>
          </div>
          {error && (
            <p role="alert" className="hk-error">
              {error}
            </p>
          )}
          <button
            className="hk-primary hk-sticky-save"
            disabled={busy}
            type="submit"
          >
            <Save />
            {busy ? "Saving…" : "Save home details"}
          </button>
        </form>
      ) : (
        <section className="hk-panel hk-home-summary">
          <h2>
            <House />
            Home summary
          </h2>
          <dl>
            {[
              {
                Icon: MapPin,
                label: "Address",
                value:
                  [saved.addressLine1, saved.city, saved.state]
                    .filter(Boolean)
                    .join(", ") || "No home details yet",
              },
              {
                Icon: BedDouble,
                label: "Bedrooms",
                value:
                  saved.bedroomCount === null
                    ? "Bedrooms not added"
                    : saved.bedroomCount === 0
                      ? "Studio"
                      : `${saved.bedroomCount} beds`,
              },
              {
                Icon: Bath,
                label: "Bathrooms",
                value:
                  saved.bathroomCount === null
                    ? "Bathrooms not added"
                    : `${saved.bathroomCount} baths`,
              },
              {
                Icon: PawPrint,
                label: "Pets",
                value: saved.hasPets ? "Pets" : "No pets",
              },
            ].map(({ Icon, label, value }) => (
              <div key={label}>
                <dt>
                  <Icon />
                  <span className="sr-only">{label}</span>
                </dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <form
        action="/auth/logout"
        method="post"
        onSubmit={(e) => {
          if (!discardChanges(dirty)) e.preventDefault();
        }}
      >
        <button className="hk-outline hk-logout" type="submit">
          <LogOut />
          Log out
        </button>
      </form>
    </>
  );
}
export function Stepper({
  label,
  value,
  min,
  step,
  onChange,
}: {
  label: string;
  value: number | null;
  min: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="hk-stepper">
      <button
        type="button"
        aria-label={`Fewer ${label.toLowerCase()}`}
        disabled={value === null || value <= min}
        onClick={() => onChange(Math.max(min, (value ?? min) - step))}
      >
        <Minus />
      </button>
      <input
        aria-label={label}
        type="number"
        min={min}
        max={20}
        step={step}
        value={value ?? ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (e.target.value && n >= min && n <= 20 && (n / step) % 1 === 0)
            onChange(n);
        }}
      />
      <button
        type="button"
        aria-label={`More ${label.toLowerCase()}`}
        disabled={value !== null && value >= 20}
        onClick={() =>
          onChange(Math.min(20, value === null ? min : value + step))
        }
      >
        <Plus />
      </button>
    </div>
  );
}
