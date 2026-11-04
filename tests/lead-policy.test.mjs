import assert from "node:assert/strict";
import test from "node:test";
import {
  parseZip,
  arrivalInstant,
  parseEmailBid,
  privateText,
} from "../lib/lead-policy.ts";
test("validates five-digit ZIPs without inventing an area", () => {
  assert.equal(parseZip(" 10001 "), "10001");
  assert.throws(() => parseZip("1000"));
  assert.throws(() => parseZip("ABCDE"));
});
test("interprets summer and winter arrivals in the service timezone", () => {
  assert.equal(
    arrivalInstant("2026-07-01", "09:00").toISOString(),
    "2026-07-01T13:00:00.000Z",
  );
  assert.equal(
    arrivalInstant("2026-12-01", "09:00").toISOString(),
    "2026-12-01T14:00:00.000Z",
  );
  assert.throws(() => arrivalInstant("2026-03-08", "02:30"));
  assert.throws(() => arrivalInstant("2026-02-30", "09:00"));
  assert.throws(() => arrivalInstant("2026-12-01", "25:00"));
});
test("accepts explicit total/date/time and rejects estimates or incomplete replies", () => {
  assert.deepEqual(parseEmailBid("$150, 2026-11-06 09:00"), {
    price: "150",
    availableDate: "2026-11-06",
    arrivalTime: "09:00",
  });
  for (const s of [
    "$150-175 Friday",
    "150",
    "maybe 150 Friday at 9am",
    "$0, 2026-11-06 09:00",
    "150, Friday",
  ])
    assert.equal(parseEmailBid(s), null);
});
test("resolves weekdays and relative days from the message receipt in New York", () => {
  const now = new Date("2026-11-04T15:00:00Z");
  assert.deepEqual(parseEmailBid("$150, Friday at 9am", now), {
    price: "150",
    availableDate: "2026-11-06",
    arrivalTime: "09:00",
  });
  assert.deepEqual(parseEmailBid("150, tomorrow 12pm", now), {
    price: "150",
    availableDate: "2026-11-05",
    arrivalTime: "12:00",
  });
  assert.equal(parseEmailBid("150, tomorrow 13pm", now), null);
});
test("detects common identifying information before relay", () => {
  for (const s of [
    "call 518 555 0197",
    "me@example.com",
    "door code 1234",
    "123 Main Street",
    "https://example.com",
  ])
    assert.equal(privateText(s), true, s);
  assert.equal(privateText("The floors are mostly hardwood."), false);
});
