import { CleanLevel, EntryMethod, RoomType } from "@prisma/client";
import {
  cleanLevelOptions,
  entryMethodOptions,
  roomTypeOptions,
} from "@/lib/marketplace-constants";

type HomeProfileFormProps = {
  defaults: {
    label: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    entryMethod: EntryMethod;
    entryNotes: string;
    defaultRoomTypes: RoomType[];
    defaultCleanLevel: CleanLevel;
    notes: string;
  };
};

export function HomeProfileForm({ defaults }: HomeProfileFormProps) {
  return (
    <form action="/customer/my-home/save" method="post" className="market-form stack">
      <section className="market-form-section stack">
        <div className="field">
          <label htmlFor="label">Preset name</label>
          <input id="label" name="label" defaultValue={defaults.label} />
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
      </section>

      <section className="market-form-section stack">
        <div className="field">
          <label htmlFor="entryMethod">How I’ll let you in</label>
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
        <div className="market-section-heading">
          <h2>Typical rooms</h2>
        </div>
        <div className="market-checkbox-grid">
          {roomTypeOptions.map((option) => (
            <label key={option.value} className="market-check-card">
              <input
                type="checkbox"
                name="defaultRoomTypes"
                value={option.value}
                defaultChecked={defaults.defaultRoomTypes.includes(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="market-form-section stack">
        <div className="field">
          <label htmlFor="defaultCleanLevel">Default level of clean</label>
          <select id="defaultCleanLevel" name="defaultCleanLevel" defaultValue={defaults.defaultCleanLevel}>
            {cleanLevelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
        <button type="submit">Save My Home</button>
      </div>
    </form>
  );
}
