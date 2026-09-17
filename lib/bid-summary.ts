export function formatBidReceivedAge(createdAt: Date | string, now = new Date()) {
  const created = new Date(createdAt);
  const elapsedMilliseconds = Math.max(0, now.getTime() - created.getTime());
  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60000);

  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hr${elapsedHours === 1 ? "" : "s"} ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
}

export function formatSubmittedArrivalTime(value: string | null | undefined) {
  const minutes = timeToMinutes(value);
  return minutes === null ? null : formatClockMinutes(minutes);
}

export function getEstimatedCompletionTime(arrivalTime: string | null | undefined, estimatedHours: number | null | undefined) {
  const arrivalMinutes = timeToMinutes(arrivalTime);
  if (arrivalMinutes === null || !estimatedHours || !Number.isFinite(estimatedHours) || estimatedHours <= 0) return null;

  return formatClockMinutes(arrivalMinutes + Math.round(estimatedHours * 60));
}

function timeToMinutes(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatClockMinutes(value: number) {
  const normalized = ((value % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}
