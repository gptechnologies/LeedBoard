"use client";

import { EntryMethod } from "@prisma/client";
import { LogOut, Minus, Plus, Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

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

export function HomeownerAccountForm({ home }: { home: AccountHome }) {
  const initialAddress = formatAddress(home);
  const [address, setAddress] = useState(initialAddress);
  const [bedrooms, setBedrooms] = useState<number | null>(home.bedroomCount);
  const [bathrooms, setBathrooms] = useState<number | null>(home.bathroomCount);
  const [addressError, setAddressError] = useState("");
  const [saving, setSaving] = useState(false);
  const parsedAddress = useMemo<ParsedAddress | null>(
    () => address.trim() === initialAddress ? pickAddress(home) : parseAddress(address),
    [address, home, initialAddress],
  );

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

        <div className="wk-account-section-heading">
          <span>Home details</span>
        </div>

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

      <form action="/auth/logout" className="wk-account-logout" method="post">
        <button className="wk-pressable" type="submit"><LogOut aria-hidden="true" />Log out</button>
      </form>
    </>
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
