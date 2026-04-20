import {
  BidPricingType,
  CleanLevel,
  EntryMethod,
  RoomType,
  ServiceNeed,
  SuppliesSource,
  TimingPreference,
} from "@prisma/client";
import { getRequiredString } from "@/lib/auth";

function requirePositiveMoney(value: FormDataEntryValue | null, label: string) {
  const raw = getRequiredString(value, label);
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a valid amount.`);
  }

  return Math.round(parsed * 100);
}

function parseEnumList<T extends string>(values: FormDataEntryValue[], enumValues: T[]) {
  return values
    .map(String)
    .filter((value): value is T => enumValues.includes(value as T));
}

export function parseServiceNeeds(values: FormDataEntryValue[]) {
  const serviceNeeds = parseEnumList(values, Object.values(ServiceNeed));

  if (serviceNeeds.length === 0) {
    throw new Error("Choose at least one service need.");
  }

  return serviceNeeds;
}

function parseRoomTypes(values: FormDataEntryValue[]) {
  const roomTypes = parseEnumList(values, Object.values(RoomType));

  if (roomTypes.length === 0) {
    throw new Error("Choose at least one room.");
  }

  return roomTypes;
}

function parseEntryMethod(value: FormDataEntryValue | null) {
  const entryMethod = getRequiredString(value, "Entry method");

  if (!Object.values(EntryMethod).includes(entryMethod as EntryMethod)) {
    throw new Error("Choose a valid entry method.");
  }

  return entryMethod as EntryMethod;
}

function parseCleanLevel(value: FormDataEntryValue | null) {
  const cleanLevel = getRequiredString(value, "Clean level");

  if (!Object.values(CleanLevel).includes(cleanLevel as CleanLevel)) {
    throw new Error("Choose a valid clean level.");
  }

  return cleanLevel as CleanLevel;
}

export function parseHomeProfileForm(formData: FormData) {
  return {
    label: String(formData.get("label") || "").trim() || "My Home",
    addressLine1: getRequiredString(formData.get("addressLine1"), "Street address"),
    addressLine2: String(formData.get("addressLine2") || "").trim() || null,
    city: getRequiredString(formData.get("city"), "City"),
    state: getRequiredString(formData.get("state"), "State"),
    postalCode: getRequiredString(formData.get("postalCode"), "ZIP code"),
    entryMethod: parseEntryMethod(formData.get("entryMethod")),
    entryNotes: String(formData.get("entryNotes") || "").trim() || null,
    suppliesSource: SuppliesSource.CLEANER_BRINGS_ALL,
    defaultRoomTypes: parseEnumList(formData.getAll("defaultRoomTypes"), Object.values(RoomType)),
    defaultCleanLevel: parseCleanLevel(formData.get("defaultCleanLevel")),
    defaultPriorityTypes: [],
    notes: String(formData.get("notes") || "").trim() || null,
    isDefault: true,
  };
}

export function parseJobRequestForm(formData: FormData) {
  const timingPreference =
    formData.get("timingPreference") === TimingPreference.TIME_SLOT
      ? TimingPreference.TIME_SLOT
      : TimingPreference.ASAP;
  const serviceNeeds = parseServiceNeeds(formData.getAll("serviceNeeds"));
  const roomTypes = parseRoomTypes(formData.getAll("roomTypes"));
  const cleanLevel = parseCleanLevel(formData.get("cleanLevel"));
  const addressLine1 = getRequiredString(formData.get("addressLine1"), "Street address");
  const city = getRequiredString(formData.get("city"), "City");
  const state = getRequiredString(formData.get("state"), "State");
  const postalCode = getRequiredString(formData.get("postalCode"), "ZIP code");
  const notes = String(formData.get("notes") || "").trim() || null;
  const title = String(formData.get("title") || "").trim() || buildJobTitle(serviceNeeds, roomTypes);

  const baseInput = {
    title,
    homeProfileId: String(formData.get("homeProfileId") || "").trim() || null,
    addressLine1,
    addressLine2: String(formData.get("addressLine2") || "").trim() || null,
    city,
    state,
    postalCode,
    serviceNeeds,
    roomTypes,
    cleanLevel,
    priorityTypes: [],
    entryMethod: parseEntryMethod(formData.get("entryMethod")),
    entryNotes: String(formData.get("entryNotes") || "").trim() || null,
    suppliesSource: SuppliesSource.CLEANER_BRINGS_ALL,
    timingPreference,
    notes,
  };

  if (timingPreference === TimingPreference.TIME_SLOT) {
    const requestedDateRaw = getRequiredString(formData.get("requestedDate"), "Date");
    const requestedWindowStart = getRequiredString(
      formData.get("requestedWindowStart"),
      "Arrival window",
    );
    const requestedWindowEnd = getRequiredString(
      formData.get("requestedWindowEnd"),
      "Arrival window end",
    );

    return {
      ...baseInput,
      requestedDate: new Date(`${requestedDateRaw}T12:00:00`),
      requestedWindowStart,
      requestedWindowEnd,
    };
  }

  return {
    ...baseInput,
    requestedDate: null,
    requestedWindowStart: null,
    requestedWindowEnd: null,
  };
}

export function parseBidForm(formData: FormData, isAsap: boolean) {
  const pricingType =
    formData.get("pricingType") === BidPricingType.FLAT
      ? BidPricingType.FLAT
      : BidPricingType.HOURLY;

  const baseInput = {
    pricingType,
    hourlyRateCents:
      pricingType === BidPricingType.HOURLY
        ? requirePositiveMoney(formData.get("hourlyRate"), "Hourly rate")
        : null,
    flatRateCents:
      pricingType === BidPricingType.FLAT
        ? requirePositiveMoney(formData.get("flatRate"), "Flat fee")
        : null,
    message: String(formData.get("message") || "").trim() || null,
  };

  if (isAsap) {
    const etaMinutes = Number(getRequiredString(formData.get("etaMinutes"), "ETA"));

    if (!Number.isFinite(etaMinutes) || etaMinutes <= 0) {
      throw new Error("ETA must be a valid number of minutes.");
    }

    return {
      ...baseInput,
      arrivalDate: null,
      arrivalWindowStart: null,
      arrivalWindowEnd: null,
      etaMinutes,
    };
  }

  const arrivalDate = new Date(
    `${getRequiredString(formData.get("arrivalDate"), "Arrival date")}T12:00:00`,
  );
  const arrivalWindowStart = getRequiredString(
    formData.get("arrivalWindowStart"),
    "Arrival window",
  );
  const arrivalWindowEnd = getRequiredString(
    formData.get("arrivalWindowEnd"),
    "Arrival window end",
  );

  return {
    ...baseInput,
    arrivalDate,
    arrivalWindowStart,
    arrivalWindowEnd,
    etaMinutes: null,
  };
}

function buildJobTitle(serviceNeeds: ServiceNeed[], roomTypes: RoomType[]) {
  const [firstNeed] = serviceNeeds;
  const [firstRoom] = roomTypes;

  if (firstNeed === ServiceNeed.DEEP_CLEAN) {
    return "Deep cleaning request";
  }

  if (firstRoom === RoomType.KITCHEN && serviceNeeds.includes(ServiceNeed.BATHROOMS)) {
    return "Kitchen and bathroom refresh";
  }

  if (firstRoom) {
    return `${humanizeValue(firstRoom)} cleaning request`;
  }

  if (firstNeed) {
    return `${humanizeValue(firstNeed)} request`;
  }

  return "Cleaning request";
}

function humanizeValue(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
