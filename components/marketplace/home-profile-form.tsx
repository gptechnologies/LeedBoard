"use client";

import { EntryMethod } from "@prisma/client";
import { entryMethodOptions } from "@/lib/marketplace-constants";

type HomeProfileFormProps = {
  homeProfileId?: string;
  submitLabel?: string;
  defaults: {
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
};

export function HomeProfileForm({
  defaults,
  homeProfileId,
  submitLabel = "Save Home Preset",
}: HomeProfileFormProps) {
  return (
    <form action="/customer/my-home/save" method="post" className="market-form stack">
      {homeProfileId ? <input type="hidden" name="homeProfileId" value={homeProfileId} /> : null}
      <section className="market-form-section stack">
        <div className="field">
          <label htmlFor="label">Home nickname</label>
          <input id="label" name="label" defaultValue={defaults.label} placeholder="Apartment, Mom's house, Office" />
        </div>
        <div className="field">
          <label htmlFor="addressLine1">Street address</label>
          <input id="addressLine1" name="addressLine1" defaultValue={defaults.addressLine1} required />
        </div>
        <div className="field">
          <label htmlFor="addressLine2">Apartment or suite</label>
          <input id="addressLine2" name="addressLine2" defaultValue={defaults.addressLine2} />
        </div>
        <div className="grid two">
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" name="city" defaultValue={defaults.city} required />
          </div>
          <div className="field">
            <label htmlFor="state">State</label>
            <input id="state" name="state" defaultValue={defaults.state} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="postalCode">ZIP code</label>
          <input id="postalCode" name="postalCode" defaultValue={defaults.postalCode} required />
        </div>

        <div className="market-home-details-grid">
          <div className="field">
            <label htmlFor="bedroomCount">Bedrooms</label>
            <input
              id="bedroomCount"
              name="bedroomCount"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue={defaults.bedroomCount ?? ""}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label htmlFor="bathroomCount">Bathrooms</label>
            <input
              id="bathroomCount"
              name="bathroomCount"
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              defaultValue={defaults.bathroomCount ?? ""}
              placeholder="1"
            />
          </div>
          <div className="field">
            <label htmlFor="estimatedSquareFeet">Square feet</label>
            <input
              id="estimatedSquareFeet"
              name="estimatedSquareFeet"
              type="number"
              min="1"
              step="50"
              inputMode="numeric"
              defaultValue={defaults.estimatedSquareFeet ?? ""}
              placeholder="1100"
            />
          </div>
          <div className="field">
            <label htmlFor="storyCount">Stories</label>
            <input
              id="storyCount"
              name="storyCount"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              defaultValue={defaults.storyCount ?? ""}
              placeholder="1"
            />
          </div>
        </div>

        <div className="field">
          <span className="field-label">Pets</span>
          <div className="market-pet-toggle">
            <label>
              <input type="radio" name="hasPets" value="false" defaultChecked={!defaults.hasPets} />
              No
            </label>
            <label>
              <input type="radio" name="hasPets" value="true" defaultChecked={defaults.hasPets} />
              Yes
            </label>
          </div>
        </div>

        <div className="field">
          <label htmlFor="entryMethod">How will the cleaners enter</label>
          <select id="entryMethod" name="entryMethod" defaultValue={defaults.entryMethod}>
            {entryMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="entryNotes">Entry notes</label>
          <textarea
            id="entryNotes"
            name="entryNotes"
            defaultValue={defaults.entryNotes}
            placeholder="Door code, call box, or where to find the key."
          />
        </div>
      </section>

      <section className="market-form-section stack">
        <div className="field">
          <label htmlFor="notes">Home notes</label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={defaults.notes}
            placeholder="Parking, pets, or building tips for future visits."
          />
        </div>
      </section>

      <div className="market-sticky-submit">
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
