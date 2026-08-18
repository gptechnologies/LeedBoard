# Well Kept — Final MVP Product & UX Plan

**Finalized:** August 16, 2026  
**Product:** Well Kept mobile-first home-cleaning marketplace  
**Document status:** Approved direction and implementation plan

## 1. Purpose

This document is the final product plan for aligning the current Well Kept application with the intended MVP experience. It replaces the earlier draft and records:

- what the application already does well;
- what needs to be refined or built;
- the implementation order;
- the product and architecture decisions that should guide the work; and
- the features intentionally deferred from the MVP.

This is an incremental upgrade plan. Existing working marketplace behavior should be preserved unless this document explicitly replaces it.

## 2. MVP Scope Decision

Well Kept is a home-cleaning marketplace. The MVP supports this loop:

```text
Homeowner verifies email
    → posts a cleaning job
    → cleaners discover the job
    → cleaners submit bids
    → homeowner compares and accepts one bid
    → both parties manage the active job
    → cleaner marks the job complete
```

### In scope

- Passwordless email OTP authentication
- Persistent sessions and lightweight account creation
- Optional homeowner profile and saved-home setup
- Fast, mobile-first cleaning-job posting
- Saved-home reuse and prefill
- Cleaner job discovery, pass/restore, and bidding
- Homeowner bid review and provider selection
- Privacy before acceptance and detail unlock after acceptance
- Email notifications with safe deep links
- Active-job status and completion
- Press feedback, motion, loading states, haptics, accessibility, and clear empty/error/success states

### Explicitly deferred

The following are not part of this implementation plan:

- **Real in-app messaging:** no message composer, realtime chat, attachments, delivery/read receipts, or conversation backend. Existing activity/coordination screens may remain as read-only job timelines and summaries, but should not imply that chat works.
- **Monetization:** no subscriptions, lead fees, service fees, checkout, payment collection, payout logic, billing UI, or monetization experiments.
- **Photo/video uploading:** no customer job media, cleaner portfolio uploads, media storage, processing, moderation, or upload UI.

Payment continues to be handled directly between homeowner and cleaner. Copy may state this fact, but no new payment workflow should be built.

## 3. Product Principle

Well Kept should feel like:

> Hinge-like for discovering and choosing opportunities, with Uber-like certainty during the job lifecycle.

This comparison describes interaction quality—not payments. Discovery should feel fast and human; execution should make status, timing, and the next action unmistakable.

### Core principles

1. Let users act on their immediate intent before asking for optional profile information.
2. Keep one obvious primary action on each screen.
3. Prefer progressive disclosure over long forms.
4. Preserve homeowner privacy until a bid is accepted.
5. Reuse verified identity, saved homes, and prior choices for repeat users.
6. Make every async action visibly acknowledge the tap, show progress, and end in a clear success or error state.
7. Use motion and haptics to communicate state changes, not decorate routine navigation.
8. Maintain visual and functional equivalents when browser haptics are unavailable.

## 4. Current Application Alignment Audit

Status meanings:

- **Aligned:** the core requirement exists and should be preserved.
- **Partial:** useful implementation exists, but the product requirement is not complete.
- **Needs change:** current behavior conflicts with the final MVP direction.
- **Deferred:** intentionally excluded from this MVP.

| Area | Status | Current application | Required outcome |
|---|---|---|---|
| Session management | Aligned | Database-backed, expiring, HTTP-only session cookies map reliably to users. | Preserve the current session architecture. |
| OTP infrastructure | Partial | OTP logic and transactional email delivery already support email, but public routes force SMS. | Make email the only required MVP verification channel. |
| Authentication entry | Needs change | Login/signup screens ask for a phone number and send a text code. Login and signup are still separate routes. | One email-first entry experience for new and returning users. |
| Account identity | Partial | User records support email and verification timestamps, but verification guards require a phone. | A verified email is sufficient; phone is optional. |
| Post-auth return | Partial | Cleaner invite tokens are preserved, but arbitrary safe return destinations are not. | Preserve a validated internal `returnTo` path through OTP. |
| Homeowner onboarding | Needs change | Six required steps collect address and property details; the customer layout blocks access until completion. | Offer saved-home setup, but allow “Skip for now” and immediate posting. |
| Saved homes | Partial | Home profiles, default values, editing, and job snapshots exist. | Add explicit home selection and support posting without a saved home. |
| Fast job form | Partial | Progressive form, schedule, notes, optimistic submit state, and success screen exist. It always uses the first saved home. | Start with location, prefill intelligently, and make the flow work for saved and unsaved homes. |
| Service scope | Needs change | UI offers cleaning, plumbing, electrical, lawn care, painting, and handyman, while submitted jobs are always modeled as general cleaning. | Make the MVP UI cleaning-only until other services are supported end to end. |
| Job creation | Aligned | Server validates input, snapshots relevant history, creates an open job, and triggers cleaner outreach. | Preserve and harden idempotency/error handling. |
| Job-posted feedback | Aligned | Posting shows progress, a dedicated success state, a clear “request is live” message, and a success haptic. | Preserve; refine wording and reduced-motion behavior. |
| Cleaner discovery | Aligned | Mobile card deck supports nearby jobs, swipe/arrow navigation, pass, restore, approximate area, and bid entry. | Preserve; add haptics, loading states, and accessibility refinements. |
| Pre-acceptance privacy | Aligned | Cleaner discovery/details show city/state/ZIP or an approximate area; the street address and access notes are not shown. | Preserve and cover with authorization tests. |
| Bid creation | Partial | Fast bid drawer, pricing choices, timing, saved defaults, note, and server transaction exist. Submission redirects to an activity screen. | Add inline submitting/success/error feedback and bid-submit haptic before navigation. |
| Homeowner bid review | Aligned | Bid cards expose price, timing, provider details, trust signals, and selection action. | Preserve and verify mobile comparison hierarchy. |
| Bid acceptance | Aligned | A transaction accepts one bid, declines remaining submitted bids, awards the job, and stores `acceptedBidId`. | Preserve; add timestamps/notifications and concurrency tests. |
| Post-acceptance details | Partial | Full address and access details unlock after acceptance. Direct contact details are not surfaced. | Keep exact details gated; add optional contact details only if collected later. |
| Activity and unread state | Aligned | Persistent viewed timestamps, unread counts, navigation badges, and job activity feedback exist. | Preserve; deduplicate notification haptics and clarify “activity” versus “messages.” |
| Active-job mode | Partial | Awarded/completed states and a cleaner completion action exist. | Make the accepted job the dominant active-job view with role-specific next actions. |
| Email delivery | Partial | Resend transactional email and cleaner new-job email/deep links exist. | Add homeowner bid, cleaner acceptance, and meaningful status emails. |
| Push/SMS | Out of core scope | Push and SMS/outreach code exists. | Neither may be required for authentication or core marketplace notifications. Keep isolated legacy/operator outreach only if it remains operationally necessary. |
| Press feedback | Partial | A reusable pressable class is applied to many recent primary controls. | Audit all tappable elements and standardize pressed, focus, disabled, and pending states. |
| Motion | Partial | Progressive reveal, button/loading animation, drawer transitions, and success feedback exist. | Add missing state transitions and honor reduced motion everywhere. |
| Haptics | Partial | Selection, job-post success, provider acceptance, and new-bid feedback exist. | Add bid, swipe, status, and error intents; remove duplicate event vibration. |
| Loading states | Needs change | Local button spinners exist and a skeleton primitive exists, but route-level marketplace skeletons do not. | Add layout-matched skeletons for job, bid, and activity screens. |
| Accessibility | Partial | Many controls have labels, keyboard support, and live regions. | Complete target-size, focus, contrast, announcement, and reduced-motion audits. |
| Real messaging | Deferred | Screens named “messages” currently behave primarily as activity/coordination views with static quick replies. | Do not add chat. Rename/reframe misleading surfaces where practical. |
| Monetization | Deferred | No marketplace payment requirement is needed. | Do not implement. |
| Photo/video upload | Deferred | Not required for the core marketplace loop. | Do not implement. |

## 5. Final Product Requirements

### 5.1 Email-first authentication

Email is the only required identity field for the MVP.

The user experience is:

```text
Enter email
    → receive one-time email code
    → verify code
    → load existing account or create lightweight account
    → return to the intended internal screen
```

Requirements:

- Use the existing OTP, Resend email, Prisma user, and session infrastructure.
- Do not introduce Supabase Auth or another authentication vendor.
- Replace phone fields and SMS copy in the public auth flow with email fields and email copy.
- A verified email satisfies the verification guard for homeowners and cleaners.
- Phone number is optional and must not gate access, onboarding, posting, bidding, or notifications.
- New and returning users use the same conceptual entry screen. `/login` and `/signup` may temporarily alias to it for compatibility.
- Preserve cleaner invite context.
- Add a validated, same-origin `returnTo` parameter. Reject external URLs and unsafe paths.
- For MVP, one email maps to one Well Kept user and one primary role. Multi-role accounts are a future decision.
- Existing phone-authenticated accounts must not be orphaned. Provide an authenticated email-linking path or an operator-assisted migration before retiring phone-only entry.

### 5.2 Lightweight account setup

After email verification, collect only information required for the immediate action. Name may be requested once for marketplace identity, but the user must not be forced through a home-profile questionnaire before entering the product.

Homeowners should see:

- **Add my home** — starts optional saved-home setup.
- **Skip for now** — enters the customer experience and can post with an address entered in the job flow.

Cleaner profile requirements remain stronger because homeowners evaluate cleaners. Keep business/profile setup proportionate to the fields actually shown on bid cards.

### 5.3 Saved homes and prefill

Saved homes should reduce repeat work, not create a prerequisite.

Requirements:

- A homeowner may save multiple homes and choose one when posting.
- The default or most recently used home is preselected.
- “Use another address” permits a one-time job address without forcing profile creation.
- Offer “Save this home for next time” after or during posting; it is optional.
- Prefill property details, entry preferences, supplies, and prior sensible choices when available.
- Job records continue to snapshot address and job-relevant details so later home edits do not rewrite historical jobs.

### 5.4 Fast cleaning-job posting

The MVP is cleaning-only. Remove unsupported home-service categories from the job form until their schemas, discovery filters, titles, validation, and fulfillment flows are implemented end to end.

Recommended sequence:

1. **Where** — saved-home picker or address entry.
2. **When** — Today, Tomorrow, Pick a date, or Flexible; then a time/window when required.
3. **Details** — optional notes and only the minimum cleaning specifics needed for a useful bid.
4. **Post request** — one sticky or clearly dominant action.

Requirements:

- A repeat homeowner should be able to post in roughly five seconds when defaults are usable.
- Reveal later sections progressively.
- Do not silently submit fake service values or present choices the backend ignores.
- Prevent duplicate submissions while pending.
- Keep user input after validation/network errors.
- Use clear, field-adjacent errors and a top-level summary only when helpful.

### 5.5 Job-posted state

After creation, show a distinct success state:

- “Your request is live.”
- What happens next: nearby cleaners can review and bid.
- Primary action: **View job**.
- Secondary optional action: refine matching details.
- Success motion and haptic, with reduced-motion and no-haptics fallbacks.

### 5.6 Email notifications and deep links

Email is the required marketplace notification channel for MVP.

Required events:

| Recipient | Event | Deep-link destination |
|---|---|---|
| Cleaner | A relevant nearby job is posted | Cleaner job detail/bid screen |
| Homeowner | A first or materially new bid arrives | Job bid review screen |
| Cleaner | Their bid is accepted | Accepted active-job/activity screen |
| Both roles | A meaningful job status changes | Role-appropriate active-job screen |

Rules:

- Notifications must be sent from committed database state, not before the transaction succeeds.
- Prefer an idempotent delivery/event record so retries do not send duplicates.
- Group or throttle bid emails after the first bid if volume becomes noisy.
- Deep links must survive authentication using the safe `returnTo` mechanism.
- Email failure must not roll back a successfully posted job, bid, or acceptance. Record and retry delivery separately.
- Push may remain an optional enhancement; SMS must not be a required fallback.

### 5.7 Cleaner discovery and bidding

Discovery remains a mobile card deck with explicit controls in addition to swipe gestures.

Job cards prioritize:

1. cleaning type/title;
2. requested timing;
3. approximate location;
4. home size/rooms and relevant property details;
5. job notes;
6. homeowner history/trust context; and
7. current bid count where useful.

Privacy rules apply throughout discovery: never serialize or render street address, unit, entry notes, homeowner email, or phone to an unaccepted cleaner.

Bid flow requirements:

- Default price/timing choices from the cleaner profile when available.
- Permit hourly or flat pricing only when validation and display are unambiguous.
- Keep the bid note optional and concise.
- Show a pending state immediately after submit.
- Show “Bid sent” success feedback and a success haptic before routing to activity.
- Maintain pass, restore, keyboard arrows, touch swipe, and visible Previous/Next controls.

### 5.8 Bid review, acceptance, and privacy

Before acceptance, the homeowner may see provider identity, business name, rating/review context, insurance signal, bid price, timing, and note. The cleaner may see only the approximate job area and job-relevant details.

On acceptance:

- Accept exactly one submitted bid in a transaction.
- Decline other submitted bids.
- Store the accepted bid as the canonical match for the MVP.
- Record `acceptedAt` or an equivalent status event for reliable notification and lifecycle display.
- Reveal the exact job address and access notes only to the accepted cleaner.
- Do not build monetization or messaging as part of acceptance.
- Show a stable confirmation state before navigation.

Authorization must enforce privacy server-side. Hiding data in the UI is insufficient.

### 5.9 Active-job mode

After acceptance, the product should switch from marketplace browsing to execution certainty.

The active-job view should show:

- accepted cleaner/homeowner identity as appropriate;
- scheduled date and time;
- agreed bid and estimated duration;
- status;
- exact address and access instructions only for authorized matched users;
- the single next action for that role; and
- a simple lifecycle such as **Accepted → Upcoming → In progress → Completed**.

The current data model has `OPEN`, `AWARDED`, and `COMPLETED`. Add states only when the UI and backend have a real transition that uses them; do not create decorative statuses with no operational meaning.

Until real messaging is in scope, replace “Message homeowner/provider” promises with accurate actions such as **View job details**, **Review coordination**, or **Mark complete**.

## 6. UI/UX System Requirements

### 6.1 Interaction and button states

Every tappable control needs visible press-down feedback before its action completes.

Standard states:

- rest;
- hover where applicable;
- pressed;
- keyboard focus;
- disabled;
- pending/loading;
- success or error when the action changes state.

Use a shared pressable primitive/class rather than one-off transforms. Keep touch targets at least 44 × 44 CSS pixels. Disabled controls must remain legible and explain unmet requirements when ambiguity is likely.

### 6.2 Motion

Use motion for:

- progressive form reveal;
- drawers/sheets;
- card advancement;
- pending-to-success transitions;
- status changes;
- unread-to-read transitions; and
- empty-state recovery actions.

Motion should generally use opacity and transform, remain brief, and never delay navigation or input. Honor `prefers-reduced-motion`; essential state changes still need immediate visual/text confirmation.

### 6.3 Loading, empty, error, and success states

- Add route-level skeletons shaped like the final job cards, bid list, activity list, and detail layout.
- Use spinners only for local actions whose surrounding layout is already present.
- Never show a blank screen while marketplace data loads.
- Empty states explain why the list is empty and offer one useful action when possible.
- Errors preserve input and explain recovery.
- Success states name what happened and what happens next.

### 6.4 Navigation and information architecture

Keep role navigation compact and task-based.

Homeowner priorities:

- current/open jobs;
- post a job;
- activity/bids; and
- account/homes.

Cleaner priorities:

- discover jobs;
- active/submitted bids;
- activity/accepted jobs; and
- account/availability.

Use persistent unread badges based on server state. Avoid duplicate entry points with different labels for the same destination. Rename “Messages” to “Activity” or “Job details” while chat is deferred.

### 6.5 Accessibility

- Complete core flows using keyboard only.
- Maintain visible focus rings.
- Announce async errors, success, and changed counts with appropriate live regions.
- Do not rely on color, animation, or haptics alone.
- Ensure minimum text/background and control-state contrast.
- Preserve native input semantics and labels.
- Provide explicit buttons for any swipe-only behavior.
- Verify zoom, text enlargement, small mobile widths, and safe-area insets.
- Honor reduced-motion preferences.

## 7. Haptic System and Recommended Order

Browser vibration is a progressive enhancement and is not consistently available—especially on iOS web. Every haptic event must have an equivalent visual and textual state change.

### Semantic intents

| Intent | Use | Suggested web vibration |
|---|---|---|
| `selection` | Meaningful option, date, time, or toggle selection | 8 ms |
| `light` | Successful card advance or committed lightweight gesture | 14 ms |
| `success` | Bid sent, job posted, provider accepted, completion | `[18, 24, 18]` |
| `warning` | Recoverable validation/action error | `[26, 38, 26]` |
| `notification` | One newly observed meaningful event | `[18, 24, 18]`, deduplicated |

Do not vibrate for routine navigation, every button tap, scrolling, typing, opening a passive screen, or animations that are already in progress.

### Implementation order

1. **Normalize the utility.** Rename the current `medium` intent to semantic `success`, add `warning` and `notification`, preserve safe no-op behavior, and centralize reduced-motion/user-preference checks if a preference is added.
2. **Preserve existing high-value events.** Job posted, provider accepted, meaningful schedule/option selection.
3. **Add bid submitted.** Trigger only after the server confirms the bid; pair with inline “Bid sent” feedback.
4. **Add committed card advance.** Trigger `light` only after a swipe crosses the threshold or Previous/Next actually changes the card.
5. **Add lifecycle transitions.** Trigger success on a user-completed status change, such as marking a job complete—not on every status render.
6. **Add recoverable error feedback.** Use `warning` for failed post, bid, accept, pass/restore, or status actions; never on initial validation while the user is still typing.
7. **Deduplicate new-event feedback.** Activity-screen and job-level trackers must share one persisted “event observed” rule so the same bid never vibrates twice.

### Current haptic gap summary

Already implemented:

- service/date/time/flexible selections;
- successful job posting;
- successful provider acceptance; and
- some new-bid/unread feedback.

Still missing or incomplete:

- the defined `light` intent is not called;
- bid submission has no haptic;
- card swipe/advance has no haptic;
- job completion/status transition has no haptic;
- recoverable errors have no haptic;
- new-bid feedback can be triggered by more than one component; and
- current naming (`medium`) describes intensity rather than product meaning.

## 8. Architecture Decisions

### Preserve

- Next.js application routes and server components/actions where currently used
- Prisma and the current database
- Existing database-backed session model
- Existing OTP challenge model and email delivery foundation
- `JobRequest`, `JobBid`, `acceptedBidId`, `HomeProfile`, and viewed-at fields
- Transactional bid acceptance
- Existing cleaner outreach pipeline, provided it does not make SMS a user requirement

### Adjust

- Verification guard: verified email, not verified phone, is the MVP requirement.
- Auth routes/UI: email-first and unified.
- Homeowner onboarding guard: optional home setup must not gate the customer product.
- Job posting: select or enter location; do not assume `homeProfiles[0]`.
- Service presentation: cleaning-only until the data model supports additional services end to end.
- Notifications: extend the existing delivery infrastructure with marketplace event types and idempotent sends.
- “Messages” surfaces: treat as activity/coordination until real messaging is intentionally scheduled.

### Minimal data changes

Prefer the smallest schema changes that create durable behavior:

- Add lifecycle timestamps or an event table only where needed for accepted/completed notification idempotency and auditability.
- Add notification event/deduplication keys if the existing delivery model cannot guarantee one send per event/recipient/channel.
- Do not add payment, subscription, message, attachment, or media tables.
- Do not introduce a separate Match model unless `acceptedBidId` proves insufficient. It is adequate for the current one-job/one-provider MVP.

## 9. Prioritized Implementation Plan

### P0 — Correct core product contradictions

#### P0.1 Email-first authentication and account migration

Work:

- Convert the OTP start and verify UI/routes from hardcoded SMS to email.
- Change session verification guards to require `emailVerifiedAt` rather than phone verification.
- Consolidate login/signup entry behavior and preserve compatibility redirects.
- Add safe `returnTo` handling alongside cleaner invite-token handling.
- Define and implement a migration/linking path for existing phone-only users.
- Add route, validation, account-reuse, session, and unsafe-return tests.

Primary code areas:

- `components/auth/otp-start-form.tsx`
- `app/auth/otp/start/route.ts`
- `app/auth/otp/verify/route.ts`
- `app/verify/page.tsx`
- `app/verify-contact/page.tsx`
- `lib/session.ts`
- `lib/otp.ts`

Acceptance criteria:

- A new homeowner and cleaner can verify an email and enter the correct role experience without providing a phone.
- A returning email user receives the same account and a valid persistent session.
- A protected deep link returns to the intended internal route after verification.
- Existing phone-only users have a documented and tested transition path.

#### P0.2 Optional homeowner onboarding and no-saved-home posting

Work:

- Remove the customer-layout redirect that makes homeowner onboarding mandatory.
- Add “Add my home” and “Skip for now.”
- Let the job flow collect a one-time address when no saved home exists.
- Keep saved-home creation available before, during, or after posting.
- Ensure no screen traps an authenticated homeowner because `homeownerOnboardingCompletedAt` is null.

Primary code areas:

- `app/customer/layout.tsx`
- `app/onboarding/homeowner/page.tsx`
- `components/onboarding/homeowner-onboarding-flow.tsx`
- `app/onboarding/homeowner/complete/route.ts`
- `app/customer/jobs/new/page.tsx`
- `components/marketplace/simple-job-request-form.tsx`

Acceptance criteria:

- A newly verified homeowner can skip home setup and begin a job post.
- A homeowner with no saved home can successfully post with a valid one-time address.
- A repeat homeowner can select among saved homes.

#### P0.3 Cleaning-only truthfulness and privacy enforcement

Work:

- Remove non-cleaning service choices from the fast post form.
- Verify public cleaner queries never select/serialize exact address, unit, entry notes, email, or phone before acceptance.
- Add authorization tests for cleaner job detail, discovery payloads, and accepted-job detail.
- Confirm only the accepted cleaner and owning homeowner can access exact coordination details.

Acceptance criteria:

- Every option shown in the job form affects validated backend data.
- An unaccepted cleaner cannot retrieve private homeowner/job location fields even by calling routes directly.
- The accepted cleaner can retrieve only the details needed to perform that job.

### P1 — Complete the marketplace loop

#### P1.1 Fast post refinement

- Implement Where → When → Details ordering.
- Add saved-home selection and one-time address entry.
- Add Today, Tomorrow, Pick a date, and Flexible shortcuts.
- Prefill default/recent choices without hiding what will be submitted.
- Preserve input across errors and prevent duplicate submission.

#### P1.2 Marketplace email events

- Send homeowner email for the first/new bid.
- Send cleaner email when accepted.
- Send role-appropriate emails for meaningful status changes.
- Add idempotency, delivery logging, retry behavior, and authenticated deep-link return.
- Keep notification failure out of the core marketplace transaction.

#### P1.3 Bid submission and acceptance finish

- Add async fast-bid submission rather than relying only on a form redirect.
- Show pending, inline success, and recoverable error states.
- Add success haptic after confirmed bid creation.
- Add acceptance/completion timestamps or events used by UI and email delivery.
- Add concurrency tests proving only one bid can win.

#### P1.4 Active-job experience

- Make the accepted job visually dominant for both roles.
- Show status, schedule, agreed bid, authorized location/access, and one next action.
- Replace misleading message CTAs while chat is deferred.
- Ensure completion updates both parties' activity and notification state.

#### P1.5 Loading and empty states

- Add `loading.tsx` or reusable layout-matched skeletons for job feeds, job details, bid review, and activity.
- Add useful empty-state actions such as Post a job, Browse jobs, or Restore passed jobs.
- Verify loading states do not shift major layout regions on mobile.

### P2 — Interaction polish and hardening

#### P2.1 Haptics in the order defined in Section 7

- Semantic utility refactor
- Bid submitted
- Card advance/swipe
- Completion/status action
- Recoverable errors
- New-event deduplication

#### P2.2 Press and motion audit

- Apply the shared pressable behavior to every tappable control.
- Add missing pending-to-success and unread-to-read transitions.
- Remove static or decorative motion that does not communicate state.
- Verify reduced-motion behavior.

#### P2.3 Accessibility and mobile QA

- Keyboard and screen-reader audits for auth, post, swipe/bid, accept, and complete.
- 44 × 44 target audit.
- Contrast, focus, zoom, text-size, safe-area, and small-width testing.
- Test visual fallbacks on devices without vibration support.

## 10. Recommended Release Sequence

Each release should remain deployable and regression-tested.

### Release 1 — Identity and entry

- Email-first unified OTP
- Verified-email session guards
- Safe return-to flow
- Existing account migration/linking
- Optional homeowner onboarding entry

### Release 2 — Honest fast posting

- No-saved-home path
- Saved-home picker
- Cleaning-only service scope
- Where → When → Details flow
- Date shortcuts, prefill, validation, and posting regression tests

### Release 3 — Marketplace completion

- Privacy authorization tests
- Inline bid submit feedback
- Acceptance concurrency hardening
- Active-job mode and accurate activity language
- Bid/acceptance/status email events

### Release 4 — Feedback and resilience

- Haptics in the Section 7 order
- Route skeletons and improved empty/error states
- Pressable coverage
- Motion/reduced-motion completion
- Accessibility and device QA

Do not begin messaging, monetization, or media upload work as part of any release above.

## 11. Definition of Done

The MVP alignment work is complete when:

- Email is the only required authentication and notification identity.
- Phone/SMS is not required anywhere in the core homeowner or cleaner flow.
- A first-time homeowner can verify, skip home setup, and post a cleaning job.
- A repeat homeowner can post rapidly using a chosen saved home and prefilled details.
- The job form displays only features supported by the backend.
- A cleaner can discover, pass/restore, and bid with clear pending/success/error feedback.
- An unaccepted cleaner cannot access exact address, entry, email, or phone data.
- A homeowner can compare bids and atomically accept exactly one cleaner.
- The accepted cleaner sees authorized job details and both roles see an accurate active-job state.
- Required marketplace emails deep-link to the correct screen and do not duplicate on retry.
- Core routes have loading, empty, error, and success states.
- Important controls visibly respond to press and meet mobile accessibility requirements.
- Haptics follow semantic rules, do not duplicate, and are never the only feedback.
- No real messaging, monetization, or photo/video upload capability has been added.

## 12. North-Star Experience

### First-time homeowner

```text
Enter email
    → verify code
    → skip or save home
    → choose/enter location
    → choose timing
    → add optional details
    → post
    → see “Your request is live”
    → receive bid email
    → compare bids
    → choose provider
    → manage active job
```

### Repeat homeowner

```text
Open Well Kept
    → Post a job
    → saved home already selected
    → choose Today/Tomorrow/Flexible
    → optional note
    → post in seconds
```

### Cleaner

```text
Open email or job feed
    → review approximate-area job card
    → swipe or use explicit controls
    → submit a prefilled bid
    → see “Bid sent”
    → receive acceptance email
    → open active job
    → view authorized location/access
    → complete the job
```

The product should feel fast, calm, private, and certain at every step.
