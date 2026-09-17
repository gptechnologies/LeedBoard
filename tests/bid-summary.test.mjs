import assert from "node:assert/strict";
import test from "node:test";

import {
  formatBidReceivedAge,
  formatSubmittedArrivalTime,
  getEstimatedCompletionTime,
} from "../lib/bid-summary.ts";

test("formats bid age as marketplace-style relative time", () => {
  const now = new Date("2026-09-15T17:00:00.000Z");
  assert.equal(formatBidReceivedAge("2026-09-15T16:52:00.000Z", now), "8 min ago");
  assert.equal(formatBidReceivedAge("2026-09-15T14:00:00.000Z", now), "3 hrs ago");
  assert.equal(formatBidReceivedAge("2026-09-13T17:00:00.000Z", now), "2 days ago");
});

test("uses the submitted arrival time and estimated duration for completion", () => {
  assert.equal(formatSubmittedArrivalTime("10:00"), "10:00 AM");
  assert.equal(getEstimatedCompletionTime("10:00", 2), "12:00 PM");
  assert.equal(getEstimatedCompletionTime("23:30", 1.5), "1:00 AM");
});

test("does not invent an arrival or completion when bid values are unavailable", () => {
  assert.equal(formatSubmittedArrivalTime(null), null);
  assert.equal(getEstimatedCompletionTime(null, 2), null);
  assert.equal(getEstimatedCompletionTime("10:00", null), null);
});
