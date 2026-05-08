"use client";

import { useState } from "react";
import { CleanLevel, EntryMethod, RoomType } from "@prisma/client";
import { HomeProfileForm } from "@/components/marketplace/home-profile-form";
import {
  entryMethodOptions,
  roomTypeOptions,
} from "@/lib/marketplace-constants";

type HomePreset = {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  entryMethod: EntryMethod;
  entryNotes: string | null;
  defaultRoomTypes: RoomType[];
  defaultCleanLevel: CleanLevel;
  roomCleanLevels: unknown;
  notes: string | null;
};

export function HomePresetsManager({ homeProfiles }: { homeProfiles: HomePreset[] }) {
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(homeProfiles.length === 0);

  return (
    <div className="stack">
      <section className="stack">
        <div className="market-section-heading">
          <h2>Saved homes ({homeProfiles.length})</h2>
        </div>
        {homeProfiles.length > 0 ? (
          <div className="market-home-preset-list">
            {homeProfiles.map((home) => {
              const isExpanded = expandedPresetId === home.id;
              return (
                <article key={home.id} className="market-card market-home-preset-card">
                  <button
                    type="button"
                    className="market-home-preset-summary"
                    onClick={() => {
                      setExpandedPresetId(isExpanded ? null : home.id);
                      setIsAdding(false);
                    }}
                    aria-expanded={isExpanded}
                  >
                    <span className="stack small">
                      <strong>{home.label}</strong>
                      <span className="market-card__meta">
                        {home.addressLine1}, {home.city}, {home.state} {home.postalCode}
                      </span>
                      <span className="market-card__meta">
                        {home.defaultRoomTypes.length > 0
                          ? formatRoomTypes(home.defaultRoomTypes)
                          : "No typical rooms saved"} · {getEntryMethodLabel(home.entryMethod)}
                      </span>
                    </span>
                    <span className="market-preset-card__chevron" aria-hidden="true">
                      {isExpanded ? "-" : "+"}
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="market-home-preset-editor">
                      <HomeProfileForm
                        homeProfileId={home.id}
                        defaults={buildHomeProfileFormDefaults(home)}
                        submitLabel="Save Home Preset"
                      />
                      <form action={`/customer/my-home/${home.id}/delete`} method="post">
                        <button type="submit" className="secondary-submit">
                          Delete Home Preset
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <section className="market-empty">
            <strong>No home presets saved yet.</strong>
            <p className="market-card__copy">
              Add a nickname, address, and typical rooms so they appear when you post a job.
            </p>
          </section>
        )}
      </section>

      <section className="stack">
        <button
          type="button"
          className="button secondary market-add-preset-button"
          onClick={() => {
            setIsAdding((current) => !current);
            setExpandedPresetId(null);
          }}
          aria-expanded={isAdding}
        >
          Add new home preset
        </button>
        {isAdding ? (
          <HomeProfileForm
            defaults={buildHomeProfileFormDefaults(null)}
            submitLabel="Add Home Preset"
          />
        ) : null}
      </section>
    </div>
  );
}

function buildHomeProfileFormDefaults(homeProfile: HomePreset | null) {
  return {
    label: homeProfile?.label ?? "",
    addressLine1: homeProfile?.addressLine1 ?? "",
    addressLine2: homeProfile?.addressLine2 ?? "",
    city: homeProfile?.city ?? "",
    state: homeProfile?.state ?? "CA",
    postalCode: homeProfile?.postalCode ?? "",
    entryMethod: homeProfile?.entryMethod ?? EntryMethod.I_WILL_BE_HOME,
    entryNotes: homeProfile?.entryNotes ?? "",
    defaultRoomTypes: homeProfile?.defaultRoomTypes ?? [],
    defaultCleanLevel: homeProfile?.defaultCleanLevel ?? CleanLevel.MEDIUM,
    roomCleanLevels: homeProfile?.roomCleanLevels ?? {},
    notes: homeProfile?.notes ?? "",
  };
}

function formatRoomTypes(roomTypes: RoomType[]) {
  return roomTypes
    .map((roomType) => roomTypeOptions.find((option) => option.value === roomType)?.label ?? roomType)
    .join(", ");
}

function getEntryMethodLabel(entryMethod: EntryMethod) {
  return entryMethodOptions.find((option) => option.value === entryMethod)?.label ?? entryMethod;
}
