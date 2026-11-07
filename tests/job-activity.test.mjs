import assert from "node:assert/strict";
import test from "node:test";
import { canDeletePosting, getJobActivity, getPostingDeletion } from "../lib/job-activity.ts";

const job = { status: "OPEN", bidCount: 3, cleanersNotifiedCount: 8, mailState: "PENDING", acceptedBidId: null };

test("open postings show real outreach and bid counts", () => {
  const activity = getJobActivity(job);
  assert.equal(activity.live, true);
  assert.equal(activity.searchDetail, "8 cleaners notified");
  assert.equal(activity.bidsDetail, "3 bids so far");
  assert.equal(getJobActivity({ ...job, bidCount: 0 }).bidsTitle, "Waiting for bids");
});

test("expired, cancelled, and booked postings never claim a live search", () => {
  for (const status of ["EXPIRED", "CANCELLED", "AWARDED", "COMPLETED"]) {
    const activity = getJobActivity({ ...job, status });
    assert.equal(activity.live, false);
    assert.notEqual(activity.badge, "In progress");
    assert.equal(activity.bidsDetail, "3 bids received");
  }
  assert.equal(getJobActivity({ ...job, status: "EXPIRED" }).searchTitle, "Search ended");
});

test("delivery failures and missing matches show attention instead of simulated progress", () => {
  for (const mailState of ["FAILED", "NO_MATCH"]) {
    const activity = getJobActivity({ ...job, mailState });
    assert.equal(activity.live, false);
    assert.equal(activity.attention, true);
    assert.equal(activity.badge, "Needs attention");
  }
});

test("every visible posting can be deleted, including accepted and completed jobs", () => {
  for (const status of ["OPEN", "EXPIRED", "AWARDED", "COMPLETED", "CANCELLED"]) {
    assert.equal(canDeletePosting({ status, acceptedBidId: null }), true);
    assert.equal(canDeletePosting({ status, acceptedBidId: "accepted-bid" }), true);
  }
  assert.equal(canDeletePosting({ status: "DELETED", acceptedBidId: null }), false);
});

test("deleting active jobs cancels them and confirmation explains the cancellation", () => {
  for (const status of ["OPEN", "AWARDED"]) {
    const deletion = getPostingDeletion({ status });
    assert.equal(deletion.active, true);
    assert.equal(deletion.status, "CANCELLED");
    assert.match(deletion.title, /Cancel and delete/);
  }
  assert.match(getPostingDeletion({ status: "AWARDED" }).description, /chosen cleaner/);
});

test("removing historical postings preserves their final state", () => {
  for (const status of ["COMPLETED", "EXPIRED", "CANCELLED"]) {
    const deletion = getPostingDeletion({ status });
    assert.equal(deletion.active, false);
    assert.equal(deletion.status, status);
    assert.equal(deletion.action, "Delete posting");
  }
});
