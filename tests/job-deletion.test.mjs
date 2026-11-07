import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { getPostingDeletion } from "../lib/job-activity.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { NextResponse } = require("next/server");
const { JobRequestStatus, UserRole } = require("@prisma/client");
const routeCode = ts.transpileModule(
  readFileSync(new URL("../app/customer/jobs/[id]/delete/route.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

// Execute the actual route with isolated persistence and notification adapters.
// No database connections, user sessions, or outbound messages are used.
function fixture({ status = "OPEN", acceptedBidId = null, deletedAt = null, owner = "owner", race = false, signedIn = true } = {}) {
  const job = { id: "job-1", status, acceptedBidId, deletedAt, revision: 3 };
  const writes = [], notices = [], bidWrites = [];
  const tx = {
    jobRequest: { updateMany: async (input) => { writes.push(input); return { count: race ? 0 : 1 }; } },
    jobBid: { updateMany: async (input) => { bidWrites.push(input); return { count: 1 }; } },
  };
  const prisma = {
    jobRequest: { findFirst: async ({ where }) => where.customerId === owner ? job : null },
    $transaction: async (callback) => callback(tx),
  };
  const adapters = {
    "@prisma/client": { JobRequestStatus, UserRole },
    "next/server": { NextResponse },
    "@/lib/prisma": { prisma },
    "@/lib/session": { requireApiUser: async () => signedIn ? { id: "owner" } : NextResponse.json({ error: "Sign in" }, { status: 401 }) },
    "@/lib/marketplace-notifications": { notifyCleanersOfJobClosure: async (...args) => notices.push(args) },
    "@/lib/job-activity": { getPostingDeletion },
  };
  const module = { exports: {} };
  runInNewContext(routeCode, {
    module, exports: module.exports, URL, Date,
    require: (name) => {
      assert.ok(name in adapters, `Unexpected route dependency: ${name}`);
      return adapters[name];
    },
  });
  const call = (confirmation = { revision: 3, status }) => module.exports.POST(
    new Request("http://localhost/customer/jobs/job-1/delete", {
      method: "POST", headers: { "X-Well-Kept-Client": "1", "Content-Type": "application/json" }, body: JSON.stringify(confirmation),
    }),
    { params: Promise.resolve({ id: "job-1" }) },
  );
  return { call, writes, notices, bidWrites };
}

test("delete route cancels open and awarded jobs and notifies affected cleaners", async () => {
  for (const status of ["OPEN", "AWARDED"]) {
    const acceptedBidId = status === "AWARDED" ? "accepted-bid" : null;
    const f = fixture({ status, acceptedBidId });
    assert.equal((await f.call()).status, 200);
    assert.equal(f.writes[0].data.status, "CANCELLED");
    assert.ok(f.writes[0].data.deletedAt instanceof Date);
    assert.equal(f.writes[0].where.acceptedBidId, acceptedBidId);
    assert.equal(f.writes[0].where.status, status);
    assert.equal(f.writes[0].where.revision, 3);
    assert.equal(f.writes[0].data.revision.increment, 1);
    assert.equal(f.bidWrites.length, 1);
    assert.deepEqual(f.notices, [["job-1", "cancelled"]]);
  }
});

test("delete route archives historical jobs without changing their outcome or notifying cleaners", async () => {
  for (const status of ["COMPLETED", "EXPIRED", "CANCELLED"]) {
    const f = fixture({ status });
    assert.equal((await f.call()).status, 200);
    assert.equal(f.writes[0].data.status, status);
    assert.ok(f.writes[0].data.deletedAt instanceof Date);
    assert.equal(f.notices.length, 0);
    assert.equal(f.bidWrites.length, 0);
  }
});

test("delete route enforces sign-in and ownership", async () => {
  const unauthorized = fixture({ signedIn: false });
  assert.equal((await unauthorized.call()).status, 401);
  assert.equal(unauthorized.writes.length, 0);
  const foreign = fixture({ owner: "someone-else" });
  assert.equal((await foreign.call()).status, 400);
  assert.equal(foreign.writes.length, 0);
});

test("stale confirmation and concurrent job changes cannot delete the changed job", async () => {
  const stale = fixture({ status: "AWARDED", acceptedBidId: "new-cleaner" });
  assert.equal((await stale.call({ revision: 3, status: "OPEN" })).status, 400);
  assert.equal(stale.writes.length, 0);
  const race = fixture({ race: true });
  assert.equal((await race.call()).status, 400);
  assert.equal(race.bidWrites.length, 0);
  assert.equal(race.notices.length, 0);
});

test("repeated deletions succeed without modifying or notifying twice", async () => {
  for (const options of [{ deletedAt: new Date() }, { status: "DELETED" }]) {
    const f = fixture(options);
    assert.equal((await f.call()).status, 200);
    assert.equal(f.writes.length, 0);
    assert.equal(f.notices.length, 0);
  }
});
