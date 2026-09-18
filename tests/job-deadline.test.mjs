import assert from "node:assert/strict";
import test from "node:test";

import { getAcceptanceDeadline, isAcceptanceClosed } from "../lib/job-deadline.ts";

test("closes ASAP posts 48 hours after posting", () => {
  const job = { createdAt: new Date("2026-09-15T12:00:00Z"), acceptanceDeadline: null, requestedDate: null, requestedWindowStart: null };
  assert.equal(getAcceptanceDeadline(job).toISOString(), "2026-09-17T12:00:00.000Z");
  assert.equal(isAcceptanceClosed(job, new Date("2026-09-17T11:59:59Z")), false);
  assert.equal(isAcceptanceClosed(job, new Date("2026-09-17T12:00:00Z")), true);
});

test("caps a scheduled job at its New York arrival, including daylight saving time", () => {
  const base = { createdAt: new Date("2026-09-15T12:00:00Z"), acceptanceDeadline: null, requestedWindowStart: "08:00" };
  assert.equal(getAcceptanceDeadline({ ...base, requestedDate: new Date("2026-09-16T12:00:00Z") }).toISOString(), "2026-09-16T12:00:00.000Z");
  assert.equal(getAcceptanceDeadline({ ...base, requestedDate: new Date("2026-12-16T12:00:00Z") }).toISOString(), "2026-09-17T12:00:00.000Z");
  const winter = { ...base, createdAt: new Date("2026-12-15T12:00:00Z"), requestedDate: new Date("2026-12-16T12:00:00Z") };
  assert.equal(getAcceptanceDeadline(winter).toISOString(), "2026-12-16T13:00:00.000Z");
});

test("honors an explicit stored deadline", () => {
  const deadline = new Date("2026-09-20T12:00:00Z");
  assert.equal(getAcceptanceDeadline({ createdAt: new Date("2026-09-15T12:00:00Z"), acceptanceDeadline: deadline, requestedDate: null, requestedWindowStart: null }), deadline);
});
