"use client";

import { EntryMethod } from "@prisma/client";
import { Bath, BedDouble, Box, ChevronRight, ClipboardList, Home, MapPin, Minus, PawPrint, Pencil, Plus, Ruler, Save, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type AccountHome = {
  id: string | null;
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
  entryMethod: EntryMethod;
  entryNotes: string;
  notes: string;
};

type ParsedAddress = Pick<AccountHome, "addressLine1" | "addressLine2" | "city" | "state" | "postalCode">;

export function HomeownerAccountForm({ home, startEditing = false }: { home: AccountHome; startEditing?: boolean }) {
  const initialAddress = formatAddress(home);
  const [editing, setEditing] = useState(startEditing);
  const [showBuilderMessage, setShowBuilderMessage] = useState(false);
  const [address, setAddress] = useState(initialAddress);
  const [bedrooms, setBedrooms] = useState<number | null>(home.bedroomCount);
  const [bathrooms, setBathrooms] = useState<number | null>(home.bathroomCount);
  const [addressError, setAddressError] = useState("");
  const [saving, setSaving] = useState(false);
  const parsedAddress = useMemo<ParsedAddress | null>(
    () => address.trim() === initialAddress ? pickAddress(home) : parseAddress(address),
    [address, home, initialAddress],
  );

  useEffect(() => {
    if (!showBuilderMessage) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowBuilderMessage(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showBuilderMessage]);

  function toggleEditing() {
    if (editing) {
      setAddress(initialAddress);
      setBedrooms(home.bedroomCount);
      setBathrooms(home.bathroomCount);
      setAddressError("");
    }
    setEditing(!editing);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!parsedAddress) {
      event.preventDefault();
      setAddressError("Enter the full street, city, state, and ZIP code.");
      return;
    }

    setAddressError("");
    setSaving(true);
  }

  return (
    <>
      <HomeProfileCard home={home} onBuild={() => setShowBuilderMessage(true)} />

      <section aria-labelledby="home-summary-heading" className="wk-home-summary-card">
        <div className="wk-home-summary-heading">
          <h2 id="home-summary-heading">Home summary</h2>
          <button className="wk-home-summary-edit wk-pressable" onClick={toggleEditing} type="button">
            {editing ? "Cancel" : "Edit"}
            {editing ? <X aria-hidden="true" /> : <Pencil aria-hidden="true" />}
          </button>
        </div>

        {editing ? (
      <form action="/customer/my-home/save" className="wk-account-editor" method="post" onSubmit={handleSubmit}>
        {home.id ? <input name="homeProfileId" type="hidden" value={home.id} /> : null}
        <input name="label" type="hidden" value={home.label || "My Home"} />
        <input name="addressLine1" type="hidden" value={parsedAddress?.addressLine1 ?? ""} />
        <input name="addressLine2" type="hidden" value={parsedAddress?.addressLine2 ?? ""} />
        <input name="city" type="hidden" value={parsedAddress?.city ?? ""} />
        <input name="state" type="hidden" value={parsedAddress?.state ?? ""} />
        <input name="postalCode" type="hidden" value={parsedAddress?.postalCode ?? ""} />
        <input name="bedroomCount" type="hidden" value={bedrooms ?? ""} />
        <input name="bathroomCount" type="hidden" value={bathrooms ?? ""} />
        <input name="storyCount" type="hidden" value={home.storyCount ?? ""} />
        <input name="entryMethod" type="hidden" value={home.entryMethod} />

        <div className="wk-account-list">
          <div className="wk-account-row">
            <label htmlFor="account-bedrooms">Bedrooms</label>
            <NumberStepper
              id="account-bedrooms"
              label="bedrooms"
              max={20}
              min={0}
              onChange={setBedrooms}
              step={1}
              value={bedrooms}
            />
          </div>

          <div className="wk-account-row">
            <label htmlFor="account-bathrooms">Bathrooms</label>
            <NumberStepper
              id="account-bathrooms"
              label="bathrooms"
              max={20}
              min={0.5}
              onChange={setBathrooms}
              step={0.5}
              value={bathrooms}
            />
          </div>

          <div className="wk-account-row">
            <label htmlFor="account-square-feet">Sq ft</label>
            <input
              defaultValue={home.estimatedSquareFeet ?? ""}
              id="account-square-feet"
              inputMode="numeric"
              min="1"
              name="estimatedSquareFeet"
              placeholder="Add square footage"
              step="1"
              type="number"
            />
          </div>

          <fieldset className="wk-account-row wk-account-row--pets">
            <legend>Pets</legend>
            <div className="wk-account-segmented">
              <label>
                <input defaultChecked={!home.hasPets} name="hasPets" type="radio" value="false" />
                <span>No pets</span>
              </label>
              <label>
                <input defaultChecked={home.hasPets} name="hasPets" type="radio" value="true" />
                <span>Pets</span>
              </label>
            </div>
          </fieldset>

          <div className="wk-account-row wk-account-row--wide">
            <label htmlFor="account-address">Address</label>
            <input
              autoComplete="street-address"
              id="account-address"
              onChange={(event) => {
                setAddress(event.target.value);
                setAddressError("");
              }}
              placeholder="Street, city, state ZIP"
              value={address}
            />
            {addressError ? <p role="alert">{addressError}</p> : null}
          </div>

          <div className="wk-account-row wk-account-row--wide">
            <label htmlFor="account-entry-notes">Entry notes</label>
            <textarea
              defaultValue={home.entryNotes}
              id="account-entry-notes"
              name="entryNotes"
              placeholder="Door code, call box, key location, or arrival instructions."
              rows={2}
            />
          </div>

          <div className="wk-account-row wk-account-row--wide">
            <label htmlFor="account-specifics">Specifics</label>
            <textarea
              defaultValue={home.notes}
              id="account-specifics"
              name="notes"
              placeholder="Flooring, priority rooms, parking, or anything cleaners should know."
              rows={3}
            />
          </div>
        </div>

        <button className="wk-account-save wk-pressable" disabled={saving} type="submit">
          <Save aria-hidden="true" />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
        ) : (
          <div className="wk-home-summary-list">
            <SummaryRow icon={MapPin} label="Location" onClick={() => setEditing(true)} value={initialAddress || "Add your address"} />
            <SummaryRow icon={PawPrint} label="Pets" onClick={() => setEditing(true)} value={home.hasPets ? "Pets in the home" : "No pets"} />
            <SummaryRow icon={ClipboardList} label="Entry notes" onClick={() => setEditing(true)} value={home.entryNotes.trim() || "Add entry instructions"} />
            <SummaryRow icon={Sparkles} label="Cleaning specifics" onClick={() => setEditing(true)} value={home.notes.trim() || "Add cleaning priorities"} />
          </div>
        )}
      </section>

      {showBuilderMessage ? (
        <div className="wk-builder-backdrop" onClick={() => setShowBuilderMessage(false)}>
          <div aria-labelledby="builder-message-heading" aria-modal="true" className="wk-builder-dialog" onClick={(event) => event.stopPropagation()} role="dialog">
            <button aria-label="Close" autoFocus className="wk-builder-close" onClick={() => setShowBuilderMessage(false)} type="button"><X aria-hidden="true" /></button>
            <Box aria-hidden="true" className="wk-builder-dialog-icon" />
            <h2 id="builder-message-heading">Home builder coming soon</h2>
            <p>You’ll be able to add and explore rooms here.</p>
            <button className="wk-builder-done wk-pressable" onClick={() => setShowBuilderMessage(false)} type="button">Got it</button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function HomeProfileCard({ home, onBuild }: { home: AccountHome; onBuild: () => void }) {
  const stats = [
    home.bedroomCount !== null ? { Icon: BedDouble, text: `${home.bedroomCount} ${home.bedroomCount === 1 ? "bedroom" : "bedrooms"}` } : null,
    home.bathroomCount !== null ? { Icon: Bath, text: `${home.bathroomCount} ${home.bathroomCount === 1 ? "bathroom" : "bathrooms"}` } : null,
    home.estimatedSquareFeet !== null ? { Icon: Ruler, text: `${home.estimatedSquareFeet.toLocaleString()} sq ft` } : null,
    home.hasPets ? { Icon: PawPrint, text: "Pets" } : null,
  ].filter((stat): stat is { Icon: typeof BedDouble; text: string } => stat !== null);

  return (
    <section aria-labelledby="your-home-heading" className="wk-home-profile-card">
      <div className="wk-home-profile-heading">
        <div>
          <h1 id="your-home-heading">Your home</h1>
          <p>Visualize and manage your home details<br className="wk-home-description-break" /> for a better clean.</p>
        </div>
        <span aria-hidden="true" className="wk-home-profile-motto">✦<small>A cleaner<br />tomorrow</small></span>
      </div>
      <img alt="Isometric illustration of a home with a bedroom, living room, kitchen, and bathroom" className="wk-home-illustration" src="/images/home-isometric.webp" />
      <button className="wk-build-home-button wk-pressable" onClick={onBuild} type="button">
        <Box aria-hidden="true" />
        <span>Build your home</span>
        <ChevronRight aria-hidden="true" />
      </button>
      {stats.length > 0 ? <div aria-label="Home details" className="wk-home-stats">
        {stats.map(({ Icon, text }) => <span className="wk-home-stat" key={text}><Icon aria-hidden="true" />{text}</span>)}
      </div> : null}
    </section>
  );
}

function SummaryRow({ icon: Icon, label, onClick, value }: { icon: typeof Home; label: string; onClick: () => void; value: string }) {
  return (
    <button className="wk-home-summary-row" onClick={onClick} type="button">
      <span className="wk-home-summary-row-icon"><Icon aria-hidden="true" /></span>
      <span className="wk-home-summary-row-copy"><strong>{label}</strong><span>{value}</span></span>
      <ChevronRight aria-hidden="true" className="wk-home-summary-row-chevron" />
    </button>
  );
}

function NumberStepper({
  id,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  id: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number | null) => void;
  step: number;
  value: number | null;
}) {
  const displayValue = value === null ? "—" : Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  const nextValue = value === null ? min : Math.min(max, value + step);

  return (
    <div aria-label={`${displayValue} ${label}`} className="wk-account-stepper" id={id} role="group">
      <button aria-label={`Decrease ${label}`} disabled={value === null || value <= min} onClick={() => onChange(value === null ? null : Math.max(min, value - step))} type="button">
        <Minus aria-hidden="true" />
      </button>
      <output aria-live="polite">{displayValue}</output>
      <button aria-label={`Increase ${label}`} disabled={value !== null && value >= max} onClick={() => onChange(nextValue)} type="button">
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}

function formatAddress(home: ParsedAddress) {
  return [
    home.addressLine1,
    home.addressLine2,
    home.city,
    [home.state, home.postalCode].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");
}

function pickAddress(home: ParsedAddress): ParsedAddress {
  return {
    addressLine1: home.addressLine1,
    addressLine2: home.addressLine2,
    city: home.city,
    state: home.state,
    postalCode: home.postalCode,
  };
}

function parseAddress(value: string): ParsedAddress | null {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  const stateAndZip = parts.at(-1)?.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
  if (parts.length < 3 || !stateAndZip) return null;

  return {
    addressLine1: parts.slice(0, -2).join(", "),
    addressLine2: "",
    city: parts.at(-2) ?? "",
    state: stateAndZip[1].trim(),
    postalCode: stateAndZip[2],
  };
}
