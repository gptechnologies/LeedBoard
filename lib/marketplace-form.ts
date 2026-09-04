import {
  BidPricingType,
  BidSelectionPriority,
  CleanLevel,
  EntryMethod,
  HomeCondition,
  JobCleanType,
  JobPriorityArea,
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

function getDefaultWholeHomeRoomTypes() {
  return [
    RoomType.KITCHEN,
    RoomType.BATHROOM,
    RoomType.BEDROOM,
    RoomType.LIVING_AREA,
    RoomType.DINING_ROOM,
    RoomType.ENTRYWAY,
  ];
}

function getDefaultServiceNeeds() {
  return [
    ServiceNeed.GENERAL_CLEANING,
    ServiceNeed.KITCHEN,
    ServiceNeed.BATHROOMS,
    ServiceNeed.FLOORS,
    ServiceNeed.DUSTING,
  ];
}

function getDefaultWholeHomeCleanLevels() {
  return Object.fromEntries(
    getDefaultWholeHomeRoomTypes().map((roomType) => [roomType, CleanLevel.MEDIUM]),
  );
}

function parseOptionalNumber(value: FormDataEntryValue | null, label: string) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid number.`);
  }

  return parsed;
}

function parseOptionalPositiveInteger(value: FormDataEntryValue | null, label: string) {
  const parsed = parseOptionalNumber(value, label);

  if (parsed === null) return null;
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a whole number greater than 0.`);
  }

  return parsed;
}

function parseBoolean(value: FormDataEntryValue | null) {
  return String(value || "").trim() === "true";
}

function parsePostalCode(value: FormDataEntryValue | null) {
  const postalCode = getRequiredString(value, "ZIP code");
  if (!/^\d{5}(?:-\d{4})?$/.test(postalCode)) {
    throw new Error("Enter a valid ZIP code.");
  }
  return postalCode;
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

function parseBidSelectionPriority(value: FormDataEntryValue | null) {
  const priority = String(value || "").trim();

  if (Object.values(BidSelectionPriority).includes(priority as BidSelectionPriority)) {
    return priority as BidSelectionPriority;
  }

  return BidSelectionPriority.BEST_OVERALL;
}

function parseJobCleanType(value: FormDataEntryValue | null) {
  const cleanType = getRequiredString(value, "Cleaning type");
  const supported: JobCleanType[] = [
    JobCleanType.STANDARD_CLEAN,
    JobCleanType.DEEP_CLEAN,
    JobCleanType.MOVE_OUT_CLEAN,
  ];

  if (!supported.includes(cleanType as JobCleanType)) {
    throw new Error("Choose a valid cleaning type.");
  }

  return cleanType as JobCleanType;
}

function parseHomeCondition(value: FormDataEntryValue | null) {
  const condition = getRequiredString(value, "Home condition");

  if (!Object.values(HomeCondition).includes(condition as HomeCondition)) {
    throw new Error("Choose a valid home condition.");
  }

  return condition as HomeCondition;
}

function parseSuppliesSource(value: FormDataEntryValue | null) {
  const source = getRequiredString(value, "Supplies");

  if (!Object.values(SuppliesSource).includes(source as SuppliesSource)) {
    throw new Error("Choose who will provide supplies.");
  }

  return source as SuppliesSource;
}

export function parseHomeProfileForm(formData: FormData) {
  const roomCleanLevels = getDefaultWholeHomeCleanLevels();
  const defaultRoomTypes = getDefaultWholeHomeRoomTypes();
  const defaultCleanLevel = CleanLevel.MEDIUM;

  return {
    label: String(formData.get("label") || "").trim() || "My Home",
    bedroomCount: parseOptionalNumber(formData.get("bedroomCount"), "Bedrooms"),
    bathroomCount: parseOptionalNumber(formData.get("bathroomCount"), "Bathrooms"),
    estimatedSquareFeet: parseOptionalPositiveInteger(
      formData.get("estimatedSquareFeet"),
      "Square footage",
    ),
    storyCount: parseOptionalPositiveInteger(formData.get("storyCount"), "Stories"),
    hasPets: parseBoolean(formData.get("hasPets")),
    addressLine1: getRequiredString(formData.get("addressLine1"), "Street address"),
    addressLine2: String(formData.get("addressLine2") || "").trim() || null,
    city: getRequiredString(formData.get("city"), "City"),
    state: getRequiredString(formData.get("state"), "State"),
    postalCode: parsePostalCode(formData.get("postalCode")),
    entryMethod: parseEntryMethod(formData.get("entryMethod")),
    entryNotes: String(formData.get("entryNotes") || "").trim() || null,
    suppliesSource: SuppliesSource.CLEANER_BRINGS_ALL,
    defaultRoomTypes,
    defaultCleanLevel,
    roomCleanLevels,
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
  const roomCleanLevels = parseRoomCleanLevels(formData.get("roomCleanLevels"));
  const parsedRoomTypes = parseEnumList(formData.getAll("roomTypes"), Object.values(RoomType));
  const roomTypes = Object.keys(roomCleanLevels).length > 0
    ? (Object.keys(roomCleanLevels) as RoomType[])
    : parsedRoomTypes.length > 0
      ? parsedRoomTypes
      : getDefaultWholeHomeRoomTypes();
  const parsedServiceNeeds = parseEnumList(
    formData.getAll("serviceNeeds"),
    Object.values(ServiceNeed),
  );
  const matchingPriorityAreas = parseEnumList(
    formData.getAll("matchingPriorityAreas"),
    Object.values(JobPriorityArea),
  );
  const serviceNeedSet = new Set(
    parsedServiceNeeds.length > 0 ? parsedServiceNeeds : getDefaultServiceNeeds(),
  );
  if (
    matchingPriorityAreas.includes(JobPriorityArea.KITCHEN) ||
    matchingPriorityAreas.includes(JobPriorityArea.INSIDE_FRIDGE) ||
    matchingPriorityAreas.includes(JobPriorityArea.INSIDE_OVEN)
  ) serviceNeedSet.add(ServiceNeed.KITCHEN);
  if (matchingPriorityAreas.includes(JobPriorityArea.BATHROOMS)) {
    serviceNeedSet.add(ServiceNeed.BATHROOMS);
  }
  if (matchingPriorityAreas.includes(JobPriorityArea.FLOORS)) {
    serviceNeedSet.add(ServiceNeed.FLOORS);
  }
  const serviceNeeds = Array.from(serviceNeedSet);
  const cleanLevel = Object.keys(roomCleanLevels).length > 0
    ? getDominantLevel(roomCleanLevels)
    : parseCleanLevel(formData.get("cleanLevel"));
  const addressLine1 = getRequiredString(formData.get("addressLine1"), "Street address");
  const city = getRequiredString(formData.get("city"), "City");
  const state = getRequiredString(formData.get("state"), "State");
  const postalCode = parsePostalCode(formData.get("postalCode"));
  const notes = String(formData.get("notes") || "").trim() || null;
  const title = String(formData.get("title") || "").trim() || buildJobTitle(serviceNeeds, roomTypes);
  const cleanType = parseJobCleanType(formData.get("cleanType"));
  const currentCondition = parseHomeCondition(formData.get("currentCondition"));

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
    roomCleanLevels,
    cleanType,
    currentCondition,
    matchingPriorityAreas,
    priorityTypes: [],
    selectionPriority: parseBidSelectionPriority(formData.get("selectionPriority")),
    entryMethod: parseEntryMethod(formData.get("entryMethod")),
    entryNotes: String(formData.get("entryNotes") || "").trim() || null,
    suppliesSource: parseSuppliesSource(formData.get("suppliesSource")),
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
    const date = new Date(`${requestedDateRaw}T12:00:00`);
    const startMatch = /^(\d{2}):(\d{2})$/.exec(requestedWindowStart);
    const endMatch = /^(\d{2}):(\d{2})$/.exec(requestedWindowEnd);

    if (Number.isNaN(date.getTime()) || !startMatch || !endMatch) {
      throw new Error("Choose a valid cleaning date and arrival window.");
    }

    const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
    const endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);
    const startIsValid = Number(startMatch[1]) <= 23 && Number(startMatch[2]) <= 59;
    const endIsValid = Number(endMatch[1]) <= 23 && Number(endMatch[2]) <= 59;
    if (!startIsValid || !endIsValid || endMinutes <= startMinutes || endMinutes - startMinutes !== 120) {
      throw new Error("Choose a two-hour arrival window that ends on the same day.");
    }

    const scheduledStart = new Date(`${requestedDateRaw}T${requestedWindowStart}:00`);
    if (scheduledStart.getTime() <= Date.now()) {
      throw new Error("Choose a future arrival time.");
    }

    return {
      ...baseInput,
      requestedDate: date,
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
    estimatedHours:
      pricingType === BidPricingType.HOURLY
        ? parseEstimatedHours(formData.get("estimatedHours"))
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

function parseEstimatedHours(value: FormDataEntryValue | null) {
  const raw = getRequiredString(value, "Estimated hours");
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 24) {
    throw new Error("Estimated hours must be between 0 and 24.");
  }

  return Math.round(parsed * 4) / 4;
}

function buildJobTitle(serviceNeeds: ServiceNeed[], roomTypes: RoomType[]) {
  void serviceNeeds;
  void roomTypes;
  return "Home Cleaning";
}

function parseRoomCleanLevels(raw: FormDataEntryValue | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(String(raw));
    if (typeof parsed !== "object" || parsed === null) return {};
    const result: Record<string, string> = {};
    const validRooms = Object.values(RoomType) as string[];
    const validLevels = Object.values(CleanLevel) as string[];
    for (const [key, value] of Object.entries(parsed)) {
      if (validRooms.includes(key) && validLevels.includes(String(value))) {
        result[key] = String(value);
      }
    }
    return result;
  } catch {
    return {};
  }
}

function getDominantLevel(levels: Record<string, string>): CleanLevel {
  const values = Object.values(levels);
  if (values.includes(CleanLevel.DEEP)) return CleanLevel.DEEP;
  if (values.includes(CleanLevel.MEDIUM)) return CleanLevel.MEDIUM;
  if (values.length > 0) return CleanLevel.LIGHT;
  return CleanLevel.MEDIUM;
}
