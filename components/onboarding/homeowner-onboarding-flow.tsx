"use client";

import { useMemo, useState } from "react";

type AddressState = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

type HomeownerOnboardingFlowProps = {
  error?: string;
  firstName: string;
  initialHeardAboutUs: string;
  initialPushEnabled: boolean;
};

const heardAboutUsOptions = [
  "Friend or neighbor",
  "Google search",
  "Social media",
  "Local ad or flyer",
  "Cleaner referral",
  "Other",
];
const homeownerFlowVideoSrc = process.env.NEXT_PUBLIC_HOMEOWNER_ONBOARDING_VIDEO_SRC;

function getInitialReferral(value: string) {
  if (!value) return "";
  return heardAboutUsOptions.includes(value) ? value : "Other";
}

function getInitialReferralOther(value: string) {
  if (!value || heardAboutUsOptions.includes(value)) return "";
  return value;
}

export function HomeownerOnboardingFlow({
  error,
  firstName,
  initialHeardAboutUs,
  initialPushEnabled,
}: HomeownerOnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<AddressState>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [addressError, setAddressError] = useState("");
  const [pushChoice, setPushChoice] = useState(initialPushEnabled ? "enabled" : "");
  const [notificationPermission, setNotificationPermission] = useState(
    initialPushEnabled ? "granted" : "",
  );
  const [heardAboutUs, setHeardAboutUs] = useState(() => getInitialReferral(initialHeardAboutUs));
  const [heardAboutUsOther, setHeardAboutUsOther] = useState(() =>
    getInitialReferralOther(initialHeardAboutUs),
  );

  const progress = useMemo(() => Math.round(((step + 1) / 4) * 100), [step]);
  const firstNameCopy = firstName
    ? `${firstName}, your first clean starts here.`
    : "Your first clean starts here.";

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
    if (step === 1) {
      const message = validateAddress();
      if (message) {
        setAddressError(message);
        return;
      }
    }

    setStep((current) => Math.min(current + 1, 3));
  }

  async function enableNotifications() {
    setPushChoice("enabled");

    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setStep(3);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch {
      setNotificationPermission("denied");
    }

    setStep(3);
  }

  function skipNotifications() {
    setPushChoice("skipped");
    setNotificationPermission("skipped");
    setStep(3);
  }

  return (
    <section className="onboarding-shell" aria-label="Homeowner onboarding">
      <form action="/onboarding/homeowner/complete" method="post" className="onboarding-panel">
        <input type="hidden" name="addressLine1" value={address.addressLine1} readOnly />
        <input type="hidden" name="addressLine2" value={address.addressLine2} readOnly />
        <input type="hidden" name="city" value={address.city} readOnly />
        <input type="hidden" name="state" value={address.state} readOnly />
        <input type="hidden" name="postalCode" value={address.postalCode} readOnly />
        <input type="hidden" name="pushChoice" value={pushChoice} readOnly />
        <input
          type="hidden"
          name="notificationPermission"
          value={notificationPermission}
          readOnly
        />
        <input type="hidden" name="heardAboutUs" value={heardAboutUs} readOnly />
        <input type="hidden" name="heardAboutUsOther" value={heardAboutUsOther} readOnly />

        <div className="onboarding-progress" aria-label={`Step ${step + 1} of 4`}>
          <div className="onboarding-progress__text">
            <span>Homeowner setup</span>
            <span>{step + 1} of 4</span>
          </div>
          <div className="onboarding-progress__track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        {error ? <div className="notice error">{error}</div> : null}

        <div className="onboarding-step">
          {step === 0 ? (
            <IntroStep firstNameCopy={firstNameCopy} />
          ) : step === 1 ? (
            <AddressStep
              address={address}
              addressError={addressError}
              updateAddress={updateAddress}
            />
          ) : step === 2 ? (
            <NotificationsStep />
          ) : (
            <ReferralStep
              heardAboutUs={heardAboutUs}
              heardAboutUsOther={heardAboutUsOther}
              setHeardAboutUs={setHeardAboutUs}
              setHeardAboutUsOther={setHeardAboutUsOther}
            />
          )}
        </div>

        <div className="onboarding-actions">
          <div
            className={
              step === 0
                ? "onboarding-actions__row onboarding-actions__row--first"
                : step === 2
                  ? "onboarding-actions__row onboarding-actions__row--three"
                  : "onboarding-actions__row"
            }
          >
            {step > 0 ? (
              <button
                type="button"
                className="button secondary"
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
              >
                Back
              </button>
            ) : null}

            {step === 2 ? (
              <>
              <button type="button" className="button secondary" onClick={skipNotifications}>
                Not now
              </button>
              <button type="button" className="button" onClick={enableNotifications}>
                Enable notifications
              </button>
              </>
            ) : step === 3 ? (
              <button type="submit" className="button">
                Finish setup
              </button>
            ) : (
              <button type="button" className="button" onClick={goNext}>
                {step === 0 ? "Start" : "Continue"}
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}

function IntroStep({ firstNameCopy }: { firstNameCopy: string }) {
  const [videoReady, setVideoReady] = useState(false);

  return (
    <div className="onboarding-intro">
      <div className="onboarding-video" aria-label="Preview of booking a clean">
        {homeownerFlowVideoSrc ? (
          <video
            className={videoReady ? "ready" : ""}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            aria-hidden="true"
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoReady(false)}
          >
            <source src={homeownerFlowVideoSrc} type="video/mp4" />
          </video>
        ) : null}
        <div className="onboarding-video__fallback">
          <div className="onboarding-video__phone">
            <span />
            <span />
            <span />
          </div>
          <div className="onboarding-video__caption">Book, compare bids, relax.</div>
        </div>
      </div>

      <div className="onboarding-copy">
        <div className="eyebrow">Well Kept for homeowners</div>
        <h1>Ready to book a clean home?</h1>
        <p>{firstNameCopy} Save your home once, then request trusted cleaners in a few taps.</p>
      </div>
    </div>
  );
}

function AddressStep({
  address,
  addressError,
  updateAddress,
}: {
  address: AddressState;
  addressError: string;
  updateAddress: (field: keyof AddressState, value: string) => void;
}) {
  return (
    <div className="onboarding-content stack">
      <div>
        <div className="eyebrow">Your home</div>
        <h1>Where should cleaners arrive?</h1>
        <p className="subtle">We use this to create your first home preset for faster requests.</p>
      </div>

      {addressError ? <div className="notice error">{addressError}</div> : null}

      <div className="onboarding-fields stack">
        <div className="field">
          <label htmlFor="onboardingAddressLine1">Street address</label>
          <input
            id="onboardingAddressLine1"
            value={address.addressLine1}
            onChange={(event) => updateAddress("addressLine1", event.target.value)}
            autoComplete="street-address"
          />
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
    </div>
  );
}

function NotificationsStep() {
  return (
    <div className="onboarding-content onboarding-content--center">
      <div className="onboarding-bell" aria-hidden="true">
        <span />
      </div>
      <div>
        <div className="eyebrow">Helpful updates</div>
        <h1>Get updates as cleaners respond.</h1>
        <p className="subtle">
          We can notify you when a cleaner bids, accepts, or updates their arrival.
        </p>
      </div>
    </div>
  );
}

function ReferralStep({
  heardAboutUs,
  heardAboutUsOther,
  setHeardAboutUs,
  setHeardAboutUsOther,
}: {
  heardAboutUs: string;
  heardAboutUsOther: string;
  setHeardAboutUs: (value: string) => void;
  setHeardAboutUsOther: (value: string) => void;
}) {
  return (
    <div className="onboarding-content stack">
      <div>
        <div className="eyebrow">One last thing</div>
        <h1>How did you hear about us?</h1>
        <p className="subtle">This helps us understand where Well Kept is reaching neighbors.</p>
      </div>

      <div className="onboarding-option-grid" role="radiogroup" aria-label="How you heard about us">
        {heardAboutUsOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={
              heardAboutUs === option ? "onboarding-option active" : "onboarding-option"
            }
            onClick={() => setHeardAboutUs(option)}
            role="radio"
            aria-checked={heardAboutUs === option}
          >
            {option}
          </button>
        ))}
      </div>

      {heardAboutUs === "Other" ? (
        <div className="field">
          <label htmlFor="heardAboutUsOther">Tell us where</label>
          <input
            id="heardAboutUsOther"
            value={heardAboutUsOther}
            onChange={(event) => setHeardAboutUsOther(event.target.value)}
            placeholder="Optional"
          />
        </div>
      ) : null}
    </div>
  );
}
