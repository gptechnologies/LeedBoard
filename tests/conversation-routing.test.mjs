import assert from "node:assert/strict";
import test from "node:test";
import { getConversationReference, resolveConversationReference } from "../lib/providers.ts";

const bids = [
  { id: "bid-abcdefgh", jobRequest: { id: "job-615689", publicReference: "WK-615689" } },
  { id: "bid-ijklmnop", jobRequest: { id: "job-615689", publicReference: "WK-615689" } },
  { id: "bid-qrstuvwx", jobRequest: { id: "job-334455", publicReference: "WK-334455" } },
];

test("conversation reference selects the correct bid when a job has multiple bids", () => {
  const ref = getConversationReference(bids[1]);
  const result = resolveConversationReference(bids, `Well Kept ${ref}: I can arrive at 10`);
  assert.equal(result.matches[0]?.id, bids[1].id);
  assert.equal(result.matches.length, 1);
  assert.equal(result.messageBody, "I can arrive at 10");
});

test("a job reference cannot silently select one of multiple cleaners", () => {
  assert.equal(resolveConversationReference(bids, "WK-615689: Is 10 okay?").matches.length, 2);
  assert.equal(resolveConversationReference(bids, "See you soon").matches.length, 3);
});

test("an unrelated reference cannot route to an available bid", () => {
  assert.equal(resolveConversationReference(bids, "WK-999999-ABCDEFGH: Hello").matches.length, 0);
  assert.equal(resolveConversationReference([bids[2]], "Hello").matches[0].id, bids[2].id);
});
