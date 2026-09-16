# Well Kept — Final Concierge MVP Plan

**Status:** Final implementation direction  
**Product:** Well Kept homeowner cleaning concierge  
**Last updated:** September 15, 2026  

This document supersedes earlier MVP plans when they conflict with the decisions below.

## 1. Product contract

Well Kept is the homeowner's cleaning concierge.

The homeowner should be able to:

1. Post a useful cleaning request in roughly ten seconds as a returning user.
2. Know that Well Kept is contacting qualified cleaners who serve the area.
3. Receive bids, proposed timing, and provider questions in one place.
4. Communicate with providers inside Well Kept before making a selection.
5. Confirm one provider.
6. Receive a final connection summary containing the accepted bid, conversation, address, and both parties' contact information.
7. Continue directly with the provider outside Well Kept.

Well Kept owns the workflow through provider confirmation. It does not manage the cleaning after the parties are connected.

## 2. Final MVP scope decisions

### Included

- Email-first homeowner authentication.
- A fast homeowner job composer.
- Saved-home prefill and immutable job snapshots.
- Matching against an approved provider roster and service areas.
- App and email outreach to eligible providers.
- No-account provider response links.
- Bid collection and comparison.
- Pre-confirmation messaging.
- Atomic acceptance of one provider.
- Two-sided phone and address handoff.
- Read-only conversation closure after confirmation.
- Final connection-summary emails to both parties.
- Honest zero-liquidity states and an operations attention queue.
- Idempotent job creation and durable notification processing.

### Deferred

- Twilio outbound SMS outreach.
- Twilio call outreach.
- Two-way SMS conversation relay.
- Public cleaner signup.
- Automated provider discovery from Google Places.
- Marketplace payments, fees, payouts, and Stripe checkout.
- Post-confirmation chat.
- Cleaner job-progress and completion workflows.
- Reviews, subscriptions, referrals, promotions, and advanced scheduling.

Until Twilio is configured, SMS and call outreach controls must remain disabled or hidden and must not be counted as completed outreach.

Before public launch, cleaner signup will be invite-only or disabled. Only approved providers may receive or bid on homeowner jobs.

## 3. Final homeowner journey

### 3.1 Entry

The main landing-page action is **Post a cleaning job**. Provider signup is a secondary link.

The primary message is:

> Post once. We contact qualified nearby cleaners. Compare their prices, availability, and messages in one place.

Do not promise automatic payment, guaranteed availability, or reviewed providers until the corresponding behavior is enforced.

### 3.2 Fast job posting

For a homeowner with a saved home, the composer contains:

1. **Where** — saved home preselected, with the option to use another address.
2. **What** — Standard, Deep, or Move-out.
3. **When** — Today, Tomorrow, or Pick a date, plus Morning, Afternoon, or a custom window.
4. **Notes** — optional.
5. **Post request**.

The saved home supplies bedrooms, bathrooms, square footage, pets, entry method, and other useful facts without requiring those questions every time.

For a new or one-time address, the user may post with the minimum required information and optionally save the home afterward.

The application must not silently classify every request as a standard, normally lived-in whole-home clean.

### 3.3 Request-live confirmation

After the job is committed, show a dedicated confirmation state:

- **Your request is live.**
- The requested service and time.
- The current outreach state.
- A primary action to view the job.
- A secondary action to correct or add details while the job remains open.

The success state must be based on the committed job, not on whether every notification has already finished.

### 3.4 Outreach status

Homeowner-facing copy must reflect observable facts:

- **Finding matching cleaners** — candidate selection is still running.
- **Sent to 6 nearby cleaners** — six invitations were successfully handed to an email/app delivery channel.
- **2 cleaners are reviewing your request** — only when an explicit provider interaction supports it.
- **2 offers ready** — two valid submitted bids exist.
- **We're expanding the search** — no qualified provider or successful delivery was found.

Never derive “notified” from the number of database outreach rows.

### 3.5 Bids and communication

The homeowner can review every active bid, sorted by the selected priority. Do not hide bids after the first three.

MVP provider offers are limited to:

- Fixed price.
- Hourly rate with estimated hours.
- Estimate or range, if both values are present and clearly labeled.

Remove **Free quote** and **Need details** as selectable bid types. Providers should ask questions through the pre-confirmation conversation instead.

The thread remains open while the job is open and the bid is submitted. It includes:

- Provider identity and trust information.
- Price and pricing type.
- Proposed date/time.
- Provider note.
- Chronological messages.

Exact address, entry instructions, and personal contact information remain private from unselected providers.

## 4. Provider confirmation and final handoff

### 4.1 Contact prerequisites

Before accepting a bid:

- The homeowner must have a valid phone number. If missing, collect it inside the confirmation drawer.
- An app-based provider must have a valid phone number before submitting a bid.
- A no-account provider already has a phone number through the provider lead record.

Phone collection should not slow down initial job posting.

### 4.2 Confirmation drawer

The final confirmation drawer shows:

- Provider name or business.
- Agreed price.
- Proposed timing.
- Job reference.
- A clear statement: **Confirming connects you directly. We will share both phone numbers and your service address, then close this conversation.**

The homeowner confirms once. Duplicate submissions return the already-confirmed result.

### 4.3 Acceptance transaction

One transaction must:

1. Verify the job is still open and owned by the homeowner.
2. Verify the chosen bid is still submitted.
3. Verify both contact phone numbers exist.
4. Mark the chosen bid accepted.
5. Mark all other submitted bids declined.
6. Mark the job confirmed/awarded and record `acceptedAt`.
7. Close the accepted conversation at `acceptedAt`.
8. Close all declined conversations.
9. Create two pending final-summary email deliveries with stable deduplication keys.

No message may be added after the conversation's close timestamp.

### 4.4 Connection screen

After confirmation, both sides see a stable, read-only connection screen containing:

- **Homeowner confirmed this provider.**
- Both names or business names.
- Both phone numbers with tap-to-call links.
- The full service address.
- Requested and accepted timing.
- Accepted price and pricing type.
- Job reference.
- The complete pre-confirmation conversation.
- Copy explaining that further coordination happens directly.

The message composer is removed. Do not show a disabled composer that implies messaging might resume.

### 4.5 Final email summary

Both the homeowner and accepted provider receive the same core connection summary after the acceptance transaction commits.

Suggested subject:

> You're connected for Well Kept job WK-1234

Email sections:

1. **Homeowner confirmed this provider.**
2. Accepted provider and homeowner names.
3. Both phone numbers.
4. Full service address.
5. Accepted bid price and pricing method.
6. Confirmed/proposed date and time.
7. Job reference.
8. The chronological pre-confirmation message thread.
9. “Continue directly by phone or text. Well Kept messaging is now closed for this job.”

The email is generated from committed database state. Delivery failure never rolls back provider acceptance. Failed summaries are retried and shown to operations.

Declined providers do not receive the accepted provider's contact information, address, or message transcript.

## 5. Reliable job creation and outreach

### 5.1 Problem to eliminate

The current workflow commits the job and then awaits outreach. If outreach throws, the homeowner can see a posting error even though the job already exists. Retrying may create a duplicate job.

### 5.2 Final architecture

Use a database-backed outbox.

The create-job request should:

1. Receive a client-generated idempotency key.
2. Return the existing job if that key was already processed for the homeowner.
3. In one database transaction:
   - Create the job and immutable job snapshot.
   - Set outreach state to `PENDING`.
   - Create an outreach work item/outbox event.
4. Commit.
5. Return the job ID and success response immediately.

A separate worker should:

1. Claim pending outreach work.
2. Select eligible approved providers.
3. Create deduplicated provider outreach rows.
4. Create/send app and email notifications.
5. Record attempted, sent, failed, and skipped outcomes.
6. Update the aggregate outreach state.
7. Retry transient failures up to a small fixed limit.
8. Send exhausted failures to the operations attention queue.

A scheduled server route processing database work every minute is sufficient for MVP. A dedicated queue product is not required.

### 5.3 Failure behavior

- Job creation failure before commit: show an error and preserve the form.
- Job committed, worker pending: show success and “Finding matching cleaners.”
- Some notifications fail: keep the job live, show only successful counts, and retry failures.
- All notifications fail: switch to zero-liquidity fallback and alert operations.
- Repeated browser submission: return the original job.

## 6. Zero-liquidity fallback

Zero liquidity is a normal marketplace condition, not a generic error.

### 6.1 Trigger conditions

Move a job to `NEEDS_ATTENTION` when any of these occur:

- No approved provider matches the service area and cleaning type.
- Candidates exist but zero invitations are successfully sent.
- An ASAP request has no bid within 15 minutes.
- A scheduled request has no bid within 2 hours.
- The requested start is approaching and no provider has been confirmed.

The time thresholds should be configuration values, not scattered constants.

### 6.2 Homeowner experience

Show:

> We're expanding the search.
>
> We have not received an available cleaner yet. Your request is still active, and the Well Kept team is reviewing it.

Provide:

- Expected next update time.
- Edit request.
- Cancel request.
- A visible **Contact Well Kept** action.

Do not show a perpetual “Notifying cleaners” animation.

### 6.3 Operations experience

Add a single **Needs attention** list ordered by urgency. Each row shows:

- Job reference and homeowner.
- Requested time.
- Eligible provider count.
- Successfully sent count.
- Failed count.
- Bid count.
- Reason it needs attention.

MVP actions:

- Retry delivery.
- Open job.
- Add/approve a provider.
- Mark contacted manually.
- Cancel or close the request.

Twilio call and SMS actions can be added to this screen later without changing the homeowner flow.

## 7. Provider access before public launch

Before public release:

- Hide or disable public cleaner signup.
- Support invite-only cleaner accounts and no-account provider links.
- Add an explicit provider status such as `PENDING`, `APPROVED`, `PAUSED`, and `BLOCKED`.
- Only `APPROVED` and available providers are eligible for outreach and bidding.
- Require at least one service ZIP and one supported service type.
- Do not record consent unless it was actually obtained.

This is intentionally a curated marketplace for MVP. Automated provider onboarding can be added after fulfillment quality is proven.

## 8. Minimal data changes

The exact naming can follow the existing Prisma conventions, but the data model needs to represent:

### Job request

- Unique homeowner-scoped client idempotency key.
- Outreach state: `PENDING`, `IN_PROGRESS`, `CONTACTED`, `NEEDS_ATTENTION`, or `FAILED`.
- Outreach started/completed timestamps.
- Immutable snapshots of bedrooms, bathrooms, square footage, pets, property type, and relevant service details.

### Cleaner/provider

- Approval status.
- Required phone for app bidders.
- Service ZIPs and supported services.

### Bid/conversation

- `conversationClosedAt`.
- Optional close reason: `ACCEPTED`, `NOT_SELECTED`, `JOB_CANCELLED`, or `JOB_EXPIRED`.

### Notification/outbox

- Work type.
- Stable deduplication key.
- Attempt count.
- Next-attempt timestamp.
- Claimed/processed timestamps.
- Last failure reason.

Existing notification delivery and outreach event tables should be extended where practical instead of creating several overlapping systems.

## 9. Implementation order

### Phase 1 — Correct product boundary

1. Collect homeowner/provider phones at the right moments.
2. Make acceptance close conversations.
3. Build the read-only connection screen.
4. Send the final summary email to both parties.
5. Remove post-confirmation messaging and completion actions.

### Phase 2 — Make posting reliable

1. Add the idempotency key.
2. Add the outreach outbox and worker.
3. Stop awaiting notification fanout in the create-job response.
4. Record real delivery outcomes.
5. Add retries and failure visibility.

### Phase 3 — Honest marketplace states

1. Add outreach-state copy and successful delivery counts.
2. Add the zero-liquidity fallback.
3. Add the operations attention list.
4. Add stale/open-job expiration handling.

### Phase 4 — Fast-post accuracy and launch cleanup

1. Add cleaning type and quick date choices to the compact composer.
2. Snapshot saved-home facts onto jobs.
3. Add a real request-live success state.
4. Show every bid.
5. Simplify provider offer types.
6. Update landing-page positioning and remove automatic-payment copy.
7. Disable public cleaner signup.

### Phase 5 — Twilio, after credentials and approval

1. Add SMS invite delivery as another outbox channel.
2. Add call tasks/actions to the operations queue.
3. Add two-way SMS relay only if it remains useful before confirmation.
4. Keep all Twilio outcomes in the same delivery and attention model.

## 10. Required tests

### Job creation

- Repeating the same idempotency key creates one job.
- Outreach failure after commit still returns the existing job as successfully posted.
- A pending worker does not block the posting response.
- Job facts remain unchanged after editing or deleting the saved home.

### Matching and outreach

- Only approved, available, service-matched providers are selected.
- Empty service areas do not match every job.
- Successful counts exclude pending, skipped, failed, and manual outreach.
- Zero matches and zero successful deliveries enter `NEEDS_ATTENTION`.
- Retry processing does not send duplicate invitations.

### Privacy and messaging

- Unselected providers never receive street address, entry notes, homeowner phone, or homeowner email.
- Pre-confirmation participants can message.
- Declined, cancelled, expired, and accepted conversations reject new messages.
- Only the accepted provider receives connection details.

### Acceptance and handoff

- Concurrent acceptance requests result in exactly one accepted bid.
- Missing homeowner or provider phone blocks confirmation with a clear correction path.
- Both connection-summary emails are created once.
- Email failure does not roll back acceptance.
- Both connection screens contain the same agreed bid, timing, contact, address, and transcript.

### Product flow

- Returning homeowner can complete the prefilled job flow in approximately ten seconds.
- Request-live, contacted, offer-ready, needs-attention, and connected states render correctly on mobile.
- All active bids remain reviewable.

## 11. MVP success metrics

Track only the measurements needed to validate the concierge loop:

- Median and 90th-percentile post-completion time.
- Eligible providers per job.
- Successfully contacted providers per job.
- Percentage of jobs entering zero-liquidity fallback.
- Time to first bid.
- Percentage of jobs receiving at least one bid.
- Percentage of bid-receiving jobs that confirm a provider.
- Final-summary delivery success rate.

## 12. Definition of done

The concierge MVP is ready when:

- A repeat homeowner can post a correctly scoped request quickly.
- Posting never appears to fail after a job was committed.
- The app reports actual outreach outcomes instead of database intent.
- Zero-liquidity jobs receive an honest homeowner state and an operations owner.
- Only approved providers can bid.
- Pre-confirmation bids and messages remain private and centralized.
- Confirmation reveals both phone numbers and the exact address only to the matched parties.
- The message thread becomes read-only at confirmation.
- Both parties receive one complete, idempotent connection-summary email.
- The product stops at connection and makes no promise to manage payment or execution afterward.

