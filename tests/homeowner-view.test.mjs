import assert from "node:assert/strict";
import test from "node:test";
import {
  clock,
  day,
  jobTiming,
  bidTiming,
  money,
  age,
  unreadBid,
} from "../lib/homeowner-view.ts";
test("formats schedule dates without shifting them to another calendar day", () => {
  assert.equal(day("2026-11-06T12:00:00Z"), "Fri, Nov 6");
  assert.equal(clock("14:00"), "2 PM");
  assert.equal(clock("00:30"), "12:30 AM");
  assert.equal(
    jobTiming({
      requestedDate: null,
      requestedWindowStart: null,
      requestedWindowEnd: null,
    }),
    "First available",
  );
  assert.equal(
    bidTiming({ arrivalDate: null, arrivalWindowStart: null }),
    "Availability to confirm",
  );
});
test("keeps cents in bids and does not invent missing prices", () => {
  assert.equal(money(14950), "$149.50");
  assert.equal(money(15000), "$150");
  assert.equal(money(null), "Price to confirm");
});
test("uses one unread conversation rule for rows and navigation", () => {
  assert.equal(
    unreadBid({ customerViewedAt: null, status: "SUBMITTED" }),
    true,
  );
  assert.equal(
    unreadBid({ customerViewedAt: new Date(), status: "SUBMITTED" }),
    false,
  );
  assert.equal(
    unreadBid({ customerViewedAt: null, status: "DECLINED" }),
    false,
  );
  assert.equal(
    unreadBid({
      customerViewedAt: null,
      status: "DECLINED",
      messages: [{ sender: "CLEANER" }],
    }),
    true,
  );
});
test("formats relative inbox ages and clamps future timestamps", () => {
  const now = Date.parse("2026-11-04T15:00:00Z");
  assert.equal(age("2026-11-04T14:50:00Z", true, now), "10m");
  assert.equal(age("2026-11-04T13:00:00Z", false, now), "2 hours ago");
  assert.equal(age("2026-11-05T15:00:00Z", true, now), "now");
});
