export type DeadlineJob = {
  acceptanceDeadline: Date | null;
  createdAt: Date;
  requestedDate: Date | null;
  requestedWindowStart: string | null;
};

const ACCEPTANCE_WINDOW_MS = 48 * 60 * 60 * 1000;

// A posting closes after 48 hours, or when its requested arrival starts if sooner.
export function getAcceptanceDeadline(job: DeadlineJob) {
  if (job.acceptanceDeadline) return job.acceptanceDeadline;
  const windowEnd = new Date(job.createdAt.getTime() + ACCEPTANCE_WINDOW_MS);
  if (!job.requestedDate || !job.requestedWindowStart) return windowEnd;
  const day = job.requestedDate.toISOString().slice(0, 10);
  const match = /^(\d{2}):(\d{2})$/.exec(job.requestedWindowStart);
  if (!match) return windowEnd;
  const [year, month, date] = day.split("-").map(Number);
  const wallTimeAsUtc = Date.UTC(year, month - 1, date, Number(match[1]), Number(match[2]));
  const zone = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" })
    .formatToParts(new Date(wallTimeAsUtc)).find((part) => part.type === "timeZoneName")?.value ?? "GMT-4";
  const offset = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(zone);
  const offsetMinutes = offset ? (offset[1] === "+" ? 1 : -1) * (Number(offset[2]) * 60 + Number(offset[3] ?? 0)) : -240;
  return new Date(Math.min(windowEnd.getTime(), wallTimeAsUtc - offsetMinutes * 60_000));
}

export function isAcceptanceClosed(job: DeadlineJob, now = new Date()) {
  return now >= getAcceptanceDeadline(job);
}
