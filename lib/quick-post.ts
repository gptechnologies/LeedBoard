import { parseZip, arrivalInstant } from "@/lib/lead-policy";
export function parseQuickPost(f: FormData) {
  const postalCode = parseZip(f.get("postalCode"));
  const beds = String(f.get("bedroomCount") ?? "");
  const baths = String(f.get("bathroomCount") ?? "");
  if (
    !beds ||
    !baths ||
    !Number.isInteger(Number(beds)) ||
    Number(beds) < 0 ||
    Number(beds) > 20 ||
    Number(baths) <= 0 ||
    Number(baths) > 20 ||
    (Number(baths) * 2) % 1
  )
    throw new Error("Choose bedrooms and bathrooms.");
  const type = String(f.get("cleanType") ?? "STANDARD_CLEAN");
  if (!["STANDARD_CLEAN", "DEEP_CLEAN", "MOVE_OUT_CLEAN"].includes(type))
    throw new Error("Choose a cleaning type.");
  const scheduled = f.get("timingPreference") === "TIME_SLOT";
  const date = String(f.get("requestedDate") ?? "");
  const start = String(f.get("requestedWindowStart") ?? "08:00");
  const end = String(f.get("requestedWindowEnd") ?? "20:00");
  if (scheduled && (arrivalInstant(date, end) <= new Date() || end <= start))
    throw new Error("Choose a future arrival window.");
  const postingKey = String(f.get("postingKey") ?? "");
  if (!/^[a-zA-Z0-9-]{20,80}$/.test(postingKey))
    throw new Error("Reload the form and try again.");
  return {
    postalCode,
    bedroomCount: Number(beds),
    bathroomCount: Number(baths),
    cleanType: type as "STANDARD_CLEAN" | "DEEP_CLEAN" | "MOVE_OUT_CLEAN",
    timingPreference: scheduled ? ("TIME_SLOT" as const) : ("ASAP" as const),
    requestedDate: scheduled ? new Date(date + "T12:00:00Z") : null,
    requestedWindowStart: scheduled ? start : null,
    requestedWindowEnd: scheduled ? end : null,
    postingKey,
    title: "Home cleaning",
    addressLine1: "",
    city: "",
    state: "",
    serviceNeeds: ["GENERAL_CLEANING" as const],
    suppliesSource: "CLEANER_BRINGS_ALL" as const,
  };
}
