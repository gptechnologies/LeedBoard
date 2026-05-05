"use client";

import { useState } from "react";
import { CleanLevel, EntryMethod, RoomType } from "@prisma/client";
import {
  cleanLevelCycle,
  cleanLevelOptions,
  entryMethodOptions,
  roomTypeOptions,
} from "@/lib/marketplace-constants";
import { RoomIcon } from "@/components/marketplace/room-icons";

type RoomCleanLevels = Partial<Record<RoomType, CleanLevel>>;

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
    roomCleanLevels: unknown;
    notes: string;
  };
};

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

function initRoomCleanLevels(defaults: HomeProfileFormProps["defaults"]): RoomCleanLevels {
  const parsed = parseRawRoomCleanLevels(defaults.roomCleanLevels);
  if (Object.keys(parsed).length > 0) return parsed;
  const map: RoomCleanLevels = {};
  for (const room of defaults.defaultRoomTypes) {
    map[room] = defaults.defaultCleanLevel;
  }
  return map;
}

function getCleanLevelLabel(level: CleanLevel): string {
  return cleanLevelOptions.find((o) => o.value === level)?.label ?? level;
}

export function HomeProfileForm({ defaults }: HomeProfileFormProps) {
  const [roomCleanLevels, setRoomCleanLevels] = useState<RoomCleanLevels>(
    () => initRoomCleanLevels(defaults),
  );

  function cycleRoomCleanLevel(room: RoomType) {
    setRoomCleanLevels((current) => {
      const currentLevel = current[room];
      if (!currentLevel) {
        return { ...current, [room]: cleanLevelCycle[0] };
      }
      const idx = cleanLevelCycle.indexOf(currentLevel);
      if (idx < cleanLevelCycle.length - 1) {
        return { ...current, [room]: cleanLevelCycle[idx + 1] };
      }
      const next = { ...current };
      delete next[room];
      return next;
    });
  }

  const selectedRoomTypes = Object.keys(roomCleanLevels) as RoomType[];

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
        <div className="market-section-heading">
          <h2>Typical rooms</h2>
        </div>
        <p className="market-card__meta">Tap to add a room. Tap again to change the clean level.</p>
        <div className="market-room-grid">
          {roomTypeOptions.map((option) => {
            const level = roomCleanLevels[option.value];
            const isActive = !!level;
            return (
              <button
                key={option.value}
                type="button"
                className={isActive ? "market-room-card active" : "market-room-card"}
                onClick={() => cycleRoomCleanLevel(option.value)}
                aria-pressed={isActive}
              >
                <span className="market-room-card__icon">
                  <RoomIcon room={option.value} />
                </span>
                <strong>{option.label}</strong>
                {level ? (
                  <span className="market-room-card__level">{getCleanLevelLabel(level)}</span>
                ) : null}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="roomCleanLevels" value={JSON.stringify(roomCleanLevels)} />
        {selectedRoomTypes.map((room) => (
          <input key={room} type="hidden" name="defaultRoomTypes" value={room} />
        ))}
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
