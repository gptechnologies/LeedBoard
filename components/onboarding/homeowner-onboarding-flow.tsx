"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import Link from "next/link";

type AddressState = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  googlePlaceId: string;
};

type PropertyType = "HOUSE" | "APARTMENT";

type HomeownerOnboardingFlowProps = {
  error?: string;
  firstName: string;
};

const bedroomOptions = [
  { label: "Studio", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5+", value: 5 },
];

const bathroomOptions = [
  { label: "1", value: 1 },
  { label: "1.5", value: 1.5 },
  { label: "2", value: 2 },
  { label: "2.5", value: 2.5 },
  { label: "3+", value: 3 },
];

function getPropertyLabel(value: PropertyType) {
  return value === "HOUSE" ? "House" : "Apartment";
}

function getBedroomLabel(value: number | null) {
  return bedroomOptions.find((option) => option.value === value)?.label ?? "";
}

function getBathroomLabel(value: number | null) {
  return bathroomOptions.find((option) => option.value === value)?.label ?? "";
}

function parsePositiveIntegerInput(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.round(parsed);
}

export function HomeownerOnboardingFlow({
  error,
  firstName,
}: HomeownerOnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [bedroomCount, setBedroomCount] = useState<number | null>(null);
  const [bathroomCount, setBathroomCount] = useState<number | null>(null);
  const [estimatedSquareFeet, setEstimatedSquareFeet] = useState<number | null>(null);
  const [storyCount, setStoryCount] = useState<number | null>(null);
  const [hasPets, setHasPets] = useState<boolean | null>(null);
  const [address, setAddress] = useState<AddressState>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    googlePlaceId: "",
  });
  const [addressError, setAddressError] = useState("");

  const progress = useMemo(() => Math.round(((step + 1) / 6) * 100), [step]);
  const firstNameCopy = firstName ? `${firstName}, ` : "";

  const steps = [
    {
      key: "address",
      eyebrow: "Address",
      title: "Where should cleaners arrive?",
      helper: "Start typing your address, then choose the matching place to fill the details.",
      summary: address.addressLine1,
      isComplete: !validateAddress(),
      content: (
        <AddressFields
          address={address}
          addressError={addressError}
          updateAddress={updateAddress}
          setAddress={setAddress}
        />
      ),
    },
    {
      key: "property",
      eyebrow: "Home profile",
      title: `${firstNameCopy}what type of place is this?`,
      helper: "This helps cleaners understand the home before they bid.",
      summary: propertyType ? getPropertyLabel(propertyType) : "",
      isComplete: Boolean(propertyType),
      content: (
        <ChoiceGrid label="Property type">
          <ChoiceButton
            label="House"
            detail="Single-family, townhome, or larger place"
            active={propertyType === "HOUSE"}
            onClick={() => setPropertyType("HOUSE")}
          />
          <ChoiceButton
            label="Apartment"
            detail="Apartment, condo, loft, or smaller unit"
            active={propertyType === "APARTMENT"}
            onClick={() => setPropertyType("APARTMENT")}
          />
        </ChoiceGrid>
      ),
    },
    {
      key: "bedrooms",
      eyebrow: "Bedrooms",
      title: "How many bedrooms should cleaners plan for?",
      helper: "Use the closest match. You can update room details later.",
      summary: bedroomCount === null ? "" : `${getBedroomLabel(bedroomCount)} bedrooms`,
      isComplete: bedroomCount !== null,
      content: (
        <SegmentedNumberGrid label="Bedrooms">
          {bedroomOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              className={bedroomCount === option.value ? "onboarding-number active" : "onboarding-number"}
              onClick={() => setBedroomCount(option.value)}
              aria-pressed={bedroomCount === option.value}
            >
              {option.label}
            </button>
          ))}
        </SegmentedNumberGrid>
      ),
    },
    {
      key: "bathrooms",
      eyebrow: "Bathrooms",
      title: "How many bathrooms are in the home?",
      helper: "Half bathrooms count too.",
      summary: bathroomCount === null ? "" : `${getBathroomLabel(bathroomCount)} bathrooms`,
      isComplete: bathroomCount !== null,
      content: (
        <SegmentedNumberGrid label="Bathrooms">
          {bathroomOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              className={bathroomCount === option.value ? "onboarding-number active" : "onboarding-number"}
              onClick={() => setBathroomCount(option.value)}
              aria-pressed={bathroomCount === option.value}
            >
              {option.label}
            </button>
          ))}
        </SegmentedNumberGrid>
      ),
    },
    {
      key: "size",
      eyebrow: "Home size",
      title: "What is the estimated size of the home?",
      helper: "A close estimate is enough. Cleaners use this with beds and baths to price the job.",
      summary:
        estimatedSquareFeet && storyCount
          ? `${estimatedSquareFeet} sq ft, ${storyCount} ${storyCount === 1 ? "story" : "stories"}`
          : "",
      isComplete: estimatedSquareFeet !== null && storyCount !== null,
      content: (
        <div className="onboarding-fields stack">
          <div className="field">
            <label htmlFor="estimatedSquareFeet">Estimated square footage</label>
            <input
              id="estimatedSquareFeet"
              value={estimatedSquareFeet ?? ""}
              onChange={(event) =>
                setEstimatedSquareFeet(
                  event.target.value === "" ? null : parsePositiveIntegerInput(event.target.value),
                )
              }
              inputMode="numeric"
              type="number"
              min="1"
              step="50"
              placeholder="1100"
            />
          </div>
          <div className="field">
            <label htmlFor="storyCount">Stories or levels</label>
            <input
              id="storyCount"
              value={storyCount ?? ""}
              onChange={(event) =>
                setStoryCount(
                  event.target.value === "" ? null : parsePositiveIntegerInput(event.target.value),
                )
              }
              inputMode="numeric"
              type="number"
              min="1"
              step="1"
              placeholder="1"
            />
          </div>
        </div>
      ),
    },
    {
      key: "pets",
      eyebrow: "Pets",
      title: "Are there pets at this home?",
      helper: "Cleaners use this to prepare supplies and arrival notes.",
      summary: hasPets === null ? "" : hasPets ? "Pets at home" : "No pets",
      isComplete: hasPets !== null,
      content: (
        <ChoiceGrid label="Pets">
          <ChoiceButton
            label="Yes"
            detail="A dog, cat, or other pet may be home"
            active={hasPets === true}
            onClick={() => setHasPets(true)}
          />
          <ChoiceButton
            label="No"
            detail="No pets cleaners need to know about"
            active={hasPets === false}
            onClick={() => setHasPets(false)}
          />
        </ChoiceGrid>
      ),
    },
  ];

  const currentStep = steps[step];
  const canContinue = currentStep.isComplete;

  function updateAddress(field: keyof AddressState, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    setAddressError("");
  }

  function validateAddress() {
    if (!address.addressLine1.trim()) return "Enter your street address.";
    if (!address.city.trim()) return "Enter your city.";
    if (!address.state.trim()) return "Enter your state.";
    if (!address.postalCode.trim()) return "Enter your ZIP code.";
    return "";
  }

  function goNext() {
    if (step === steps.length - 1) {
      const message = validateAddress();
      setAddressError(message);
      return;
    }

    if (!canContinue) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  return (
    <section className="onboarding-shell" aria-label="Homeowner onboarding">
      <form action="/onboarding/homeowner/complete" method="post" className="onboarding-panel onboarding-panel--progressive">
        <input type="hidden" name="propertyType" value={propertyType} readOnly />
        <input type="hidden" name="bedroomCount" value={bedroomCount ?? ""} readOnly />
        <input type="hidden" name="bathroomCount" value={bathroomCount ?? ""} readOnly />
        <input type="hidden" name="estimatedSquareFeet" value={estimatedSquareFeet ?? ""} readOnly />
        <input type="hidden" name="storyCount" value={storyCount ?? ""} readOnly />
        <input type="hidden" name="hasPets" value={hasPets === null ? "" : String(hasPets)} readOnly />
        <input type="hidden" name="addressLine1" value={address.addressLine1} readOnly />
        <input type="hidden" name="addressLine2" value={address.addressLine2} readOnly />
        <input type="hidden" name="city" value={address.city} readOnly />
        <input type="hidden" name="state" value={address.state} readOnly />
        <input type="hidden" name="postalCode" value={address.postalCode} readOnly />
        <input type="hidden" name="googlePlaceId" value={address.googlePlaceId} readOnly />

        <div className="onboarding-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
          <div className="onboarding-progress__text">
            <span>Homeowner setup</span>
            <span>{step + 1} of {steps.length}</span>
          </div>
          <div className="onboarding-progress__track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="onboarding-optional-note">
          <span>Optional setup</span>
          <Link href="/customer/jobs/new">Skip for now</Link>
        </div>

        {error ? <div className="notice error">{error}</div> : null}

        <div className="onboarding-question-list">
          {steps.map((item, index) => {
            const status = index === step ? "active" : index < step ? "complete" : "upcoming";
            return (
              <section
                key={item.key}
                className={`onboarding-question onboarding-question--${status}`}
                aria-current={index === step ? "step" : undefined}
              >
                <button
                  type="button"
                  className="onboarding-question__summary"
                  onClick={() => index < step && setStep(index)}
                  disabled={index >= step}
                >
                  <span>{index + 1}</span>
                  <strong>{item.summary || item.eyebrow}</strong>
                </button>

                {index === step ? (
                  <div className="onboarding-question__body">
                    <div>
                      <div className="eyebrow">{item.eyebrow}</div>
                      <h1>{item.title}</h1>
                      <p className="subtle">{item.helper}</p>
                    </div>
                    {item.content}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="onboarding-actions onboarding-actions--floating">
          <div className="onboarding-actions__row">
            <button
              type="button"
              className="button secondary"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              disabled={step === 0}
            >
              Back
            </button>
            {step === steps.length - 1 ? (
              <button type="submit" className="button" disabled={!canContinue}>
                Finish setup
              </button>
            ) : (
              <button type="button" className="button" onClick={goNext} disabled={!canContinue}>
                Next
              </button>
            )}
          </div>
          <Link className="onboarding-skip-link" href="/customer/jobs/new">
            Skip and post a job
          </Link>
        </div>
      </form>
    </section>
  );
}

function ChoiceGrid({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="onboarding-choice-grid" role="group" aria-label={label}>
      {children}
    </div>
  );
}

function ChoiceButton({
  active,
  detail,
  label,
  onClick,
}: {
  active: boolean;
  detail: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "onboarding-choice active" : "onboarding-choice"}
      onClick={onClick}
      aria-pressed={active}
    >
      <strong>{label}</strong>
      <span>{detail}</span>
    </button>
  );
}

function SegmentedNumberGrid({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="onboarding-number-grid" role="group" aria-label={label}>
      {children}
    </div>
  );
}

function AddressFields({
  address,
  addressError,
  setAddress,
  updateAddress,
}: {
  address: AddressState;
  addressError: string;
  setAddress: Dispatch<SetStateAction<AddressState>>;
  updateAddress: (field: keyof AddressState, value: string) => void;
}) {
  const autocompleteRef = useRef<HTMLInputElement | null>(null);
  const [autocompleteStatus, setAutocompleteStatus] = useState<"idle" | "ready" | "manual">(
    "idle",
  );

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || !autocompleteRef.current) {
      setAutocompleteStatus("manual");
      return;
    }

    let cancelled = false;

    loadGooglePlaces(apiKey)
      .then(() => {
        if (cancelled || !autocompleteRef.current || !window.google?.maps?.places) {
          return;
        }

        const autocomplete = new window.google.maps.places.Autocomplete(
          autocompleteRef.current,
          {
            componentRestrictions: { country: "us" },
            fields: ["address_components", "place_id"],
            types: ["address"],
          },
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const parsedAddress = parseGoogleAddress(place);

          if (!parsedAddress) return;

          setAddress((current) => ({
            ...current,
            ...parsedAddress,
            googlePlaceId: place.place_id ?? "",
          }));
        });
        setAutocompleteStatus("ready");
      })
      .catch(() => setAutocompleteStatus("manual"));

    return () => {
      cancelled = true;
    };
  }, [setAddress]);

  return (
    <div className="onboarding-fields stack">
      {addressError ? <div className="notice error">{addressError}</div> : null}

      <div className="field">
        <label htmlFor="onboardingAddressSearch">Street address</label>
        <input
          ref={autocompleteRef}
          id="onboardingAddressSearch"
          value={address.addressLine1}
          onChange={(event) => {
            updateAddress("addressLine1", event.target.value);
            updateAddress("googlePlaceId", "");
          }}
          autoComplete="street-address"
          placeholder="Start typing your address"
        />
        {autocompleteStatus === "manual" ? (
          <span className="field-hint">Address lookup is unavailable. Enter it manually.</span>
        ) : null}
      </div>
      <div className="field">
        <label htmlFor="onboardingAddressLine2">Apartment or suite</label>
        <input
          id="onboardingAddressLine2"
          value={address.addressLine2}
          onChange={(event) => updateAddress("addressLine2", event.target.value)}
          autoComplete="address-line2"
        />
      </div>
      <div className="grid two">
        <div className="field">
          <label htmlFor="onboardingCity">City</label>
          <input
            id="onboardingCity"
            value={address.city}
            onChange={(event) => updateAddress("city", event.target.value)}
            autoComplete="address-level2"
          />
        </div>
        <div className="field">
          <label htmlFor="onboardingState">State</label>
          <input
            id="onboardingState"
            value={address.state}
            onChange={(event) => updateAddress("state", event.target.value)}
            autoComplete="address-level1"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="onboardingPostalCode">ZIP code</label>
        <input
          id="onboardingPostalCode"
          value={address.postalCode}
          onChange={(event) => updateAddress("postalCode", event.target.value)}
          autoComplete="postal-code"
          inputMode="numeric"
        />
      </div>
    </div>
  );
}

type GoogleAddressPart = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GooglePlace = {
  address_components?: GoogleAddressPart[];
  place_id?: string;
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options: Record<string, unknown>,
          ) => {
            addListener: (eventName: string, callback: () => void) => void;
            getPlace: () => GooglePlace;
          };
        };
      };
    };
  }
}

let googlePlacesPromise: Promise<void> | null = null;

function loadGooglePlaces(apiKey: string) {
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (googlePlacesPromise) {
    return googlePlacesPromise;
  }

  googlePlacesPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-places="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googlePlaces = "true";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googlePlacesPromise;
}

function parseGoogleAddress(place: GooglePlace): AddressState | null {
  const components = place.address_components;

  if (!components?.length) {
    return null;
  }

  const streetNumber = getAddressComponent(components, "street_number", "long");
  const route = getAddressComponent(components, "route", "long");
  const city =
    getAddressComponent(components, "locality", "long") ||
    getAddressComponent(components, "postal_town", "long") ||
    getAddressComponent(components, "sublocality", "long");
  const state = getAddressComponent(components, "administrative_area_level_1", "short");
  const postalCode = getAddressComponent(components, "postal_code", "long");

  return {
    addressLine1: [streetNumber, route].filter(Boolean).join(" ").trim(),
    addressLine2: "",
    city,
    state,
    postalCode,
    googlePlaceId: place.place_id ?? "",
  };
}

function getAddressComponent(
  components: GoogleAddressPart[],
  type: string,
  name: "long" | "short",
) {
  const component = components.find((item) => item.types.includes(type));
  return name === "short" ? component?.short_name ?? "" : component?.long_name ?? "";
}
