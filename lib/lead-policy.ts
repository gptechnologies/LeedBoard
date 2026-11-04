export function parseZip(value: unknown) {
  const zip = String(value ?? "").trim();
  if (!/^\d{5}$/.test(zip)) throw new Error("Enter a five-digit ZIP code.");
  return zip;
}
export function privateText(value: string) {
  // Preselection messages with potentially identifying data are held for operations review.
  return /@|https?:|www\.|\b\d[\d ().+-]{6,}\d\b|\b\d+\s+[\w .]+\s(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct)\b|buzzer|gate code|door code|entry code/i.test(
    value,
  );
}
export function arrivalInstant(
  date: string,
  time: string,
  zone = "America/New_York",
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    throw new Error("Choose a valid date and arrival time.");
  const wall = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(wall)) throw new Error("Choose a valid date.");
  if (new Date(wall).toISOString().slice(0, 10) !== date)
    throw new Error("Choose a valid calendar date.");
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(new Date(instant))
        .map((x) => [x.type, x.value]),
    );
    const rendered = Date.parse(
      `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`,
    );
    if (rendered === wall) return new Date(instant);
    instant += wall - rendered;
  }
  throw new Error(
    "That time does not exist in the local timezone. Choose another time.",
  );
}
export function parseEmailBid(body: string, now = new Date()) {
  const clean = body.split(/\n(?:On .*wrote:|>)/)[0].trim();
  const explicit =
    /^\$?(\d+(?:\.\d{1,2})?)\s*[,;]\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*$/i.exec(
      clean,
    );
  if (explicit && Number(explicit[1]) > 0 && Number(explicit[1]) <= 10000)
    return {
      price: explicit[1],
      availableDate: explicit[2],
      arrivalTime: explicit[3],
    };
  const m =
    /^\$?(\d+(?:\.\d{1,2})?)\s*[,;]\s*(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*$/i.exec(
      clean,
    );
  if (
    !m ||
    Number(m[1]) <= 0 ||
    Number(m[1]) > 10000 ||
    Number(m[3]) < 1 ||
    Number(m[3]) > 12 ||
    Number(m[4] ?? 0) > 59
  )
    return null;
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const date = new Date(day + "T12:00:00Z");
  const name = m[2].toLowerCase();
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const offset =
    name === "today"
      ? 0
      : name === "tomorrow"
        ? 1
        : (days.indexOf(name) - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + offset);
  const hour = (Number(m[3]) % 12) + (m[5].toLowerCase() === "pm" ? 12 : 0);
  return {
    price: m[1],
    availableDate: date.toISOString().slice(0, 10),
    arrivalTime: `${String(hour).padStart(2, "0")}:${m[4] ?? "00"}`,
  };
}
