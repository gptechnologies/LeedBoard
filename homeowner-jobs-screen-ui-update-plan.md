# Well Kept — Homeowner Jobs Screen UI Update Plan

## Purpose

Redesign the homeowner’s primary **Jobs** screen so it behaves like a calm, decision-oriented job workspace.

The homeowner should be able to do three things immediately after opening the screen:

1. Post a new job.
2. Understand the current state of an existing job.
3. Compare and act on offers without scrolling through a large nested job card.

This plan is based on the current homeowner Jobs screen and the provided mobile reference.

---

## Core UX Decision

Treat the selected job as **page context**, not as a large wrapper card around every piece of content.

The screen should have four distinct layers:

```text
App header
  ↓
Post a new job
  ↓
Active-job picker (carousel only when there is more than one active job)
  ↓
Selected-job summary + offer workspace
```

The offer list belongs directly on the page under the selected-job summary. It must not live inside the same large card as the job metadata.

### Scope of the primary Jobs workspace

- **Active jobs** are jobs with an `OPEN` or `AWARDED` status. Only these jobs appear in the active-job picker and can become the selected job.
- Completed, expired, and cancelled jobs are not mixed into this decision workspace. They retain their existing detail and coordination routes and can receive a dedicated history surface later.
- This workspace replaces the current general-purpose Activity experience at `/customer/jobs`. The existing job-posting, job-detail, offer-detail, and message routes remain valid deep links during the transition.

---

## Target Screen Structure

### 1. Persistent header

Keep the existing Well Kept wordmark and account control. The header should remain visually quiet so the job workspace is the focus.

### 2. Primary action: “Create new job”

Place one full-width primary button immediately below the header:

```text
[  Create new job  ]
```

Behavior:

- Always visible at the top of the page.
- Opens the current homeowner job-posting flow.
- Uses the single Well Kept green primary-action treatment.
- Does not move into the carousel or compete with offer actions.

### 3. Active-job picker

Show this only when the homeowner has active jobs.

#### One active job

Do not show carousel arrows or pagination dots. Show the selected job’s compact identity panel directly.

#### Two or more active jobs

Use a horizontal, snap-based carousel with a compact progress label such as `1 of 3` and understated dots. Each slide should identify the job, but should not include its full offer list.

Each job-picker slide includes only:

- Cleaning type/title
- Posted time
- Job status
- Offer count or “Collecting offers”

Selecting or swiping a job updates the summary and offer workspace below. Preserve selection in the URL (for example, `?job=...`) so returning from offer details restores the same job.

### 4. Selected-job summary

Below the picker, show a compact summary panel for the selected job. This replaces the current long detail block.

#### Always-visible summary content

- Service title, for example `Home Cleaning`
- Posted time
- Open/collecting/accepted status
- Approximate location: city + ZIP or neighborhood
- Requested date and time
- Human-readable Well Kept job reference

#### Layout

Use a three-item metadata grid on mobile, matching the visual direction of the reference:

```text
Location          Requested           Job ID
Watervliet, NY    Today · ASAP        WK-1842
```

The street address should not be shown in the Jobs overview. It can remain available in the dedicated job detail view and after acceptance where appropriate.

#### Visual “Edit job” tag

While a job is open, show the small `Edit job` tag in the upper-right of the selected-job summary, matching the supplied reference. For this release it is presentational only: render it as a non-interactive label, not a link or button. Job editing and offer invalidation are out of scope.

#### Expandable “Job details” disclosure

Move lower-priority data out of the overview:

- Bedrooms, bathrooms, square footage
- Cleaning condition and priority areas
- Pets, supplies, and access preferences
- Homeowner notes

Show these in a single expandable disclosure or in the dedicated job-detail screen. The Jobs page should not become a long specification sheet.

### 5. Offer workspace

This is the dominant lower section of the page.

Header:

```text
Offers received  [4]                         Sort: Best match
```

Use the count as a compact status badge. The sort control should be a real selector with these initial choices:

- Best match
- Lowest price
- Soonest available
- Highest rated

The default should remain aligned to the homeowner’s job preference when one is available; otherwise use `Best match`.

#### Offer rows

Render offers as independent, compact rows with a clear visual rhythm. Avoid placing cards inside another card inside another card.

Each offer row needs:

- Provider mark/avatar and business name
- Rating and review count when available
- Offer type badge: fixed price, estimate, hourly, free quote, or needs details
- Price or price range
- Schedule match and arrival time
- One short provider note, truncated after two lines
- A chevron or “View details” affordance

Use a status cue for schedule fit:

- Green check: matches requested timing
- Neutral clock: alternate availability
- Soft amber tag: earliest/fastest alternative

#### Offer actions

Do not show a final-sounding `Connect` button on every list row before the homeowner has reviewed the offer.

Use:

- `View offer` or row tap for the normal list action
- `Accept offer` only on the detail sheet/screen after the homeowner reviews price, timing, terms, and provider information
- `Request details` for a provider that submitted a question or needs more information

The accepted offer should move into an `Accepted provider` section at the top of the selected job and leave the open-offer list.

---

## Screen States

### A. No active jobs

```text
No active jobs
Post a cleaning request and we’ll collect offers from local providers.

[ Create new job ]
```

Do not render an empty carousel or an empty summary card.

### B. Job posted, no offers yet

Show the selected-job summary followed by an outreach/progress section:

```text
Finding providers
We’re collecting availability and pricing for this job.

0 offers received
```

Once real outreach data is available, this can show factual counts such as contacted providers, responses, and offers. Until then, avoid invented progress numbers.

### C. One or more offers

Show the offer workspace and sorted list. The first offer may receive a subtle `Best match` label, but no offer should look preselected.

### D. Accepted provider

Replace the open offer workspace with:

- Accepted provider summary
- Accepted price and scheduled time
- Contact action(s)
- Link to job details
- A retained “Other offers” disclosure for recordkeeping, not decision-making

### E. Closed, expired, or cancelled job

Keep this status out of the primary Jobs workspace and active-job picker. Existing job-detail and coordination routes remain available; a dedicated history surface is deferred.

### F. Loading and error states

- Use layout-matched skeletons for the job picker, metadata grid, and three offer rows.
- Keep errors inline and scoped to the affected job or offer action.
- Preserve the selected job and visible offers if an action fails.

---

## Interaction Model

| Interaction | Result |
| --- | --- |
| Tap/swipe active job | Changes the selected job, summary, and offer list together. |
| Tap summary or `Job details` | Opens the existing full job detail screen. |
| Tap offer row | Opens offer detail as a sheet on mobile or a dedicated page. |
| Change sort | Reorders only the selected job’s offers; does not change the recommended offer. |
| Accept offer | Shows a confirmation step, then moves the job to accepted state and reveals contact information. |
| View `Edit job` tag | No action in this release; it is a visual placeholder for the later edit flow. |

Use short transform/opacity transitions for carousel selection and offer reordering. Respect reduced-motion preferences; animation must not delay an offer action.

---

## Content and Trust Rules

- Say `offers`, not `bids`, in homeowner-facing UI.
- Distinguish imported public rating/review data from Well Kept verification.
- Never call a provider “vetted,” “insured,” or “reviewed by Well Kept” unless the stored data proves it.
- Keep exact homeowner address, access notes, and contact information out of the pre-acceptance overview.
- Use the shared job reference consistently in the picker, summary, offer details, acceptance state, and support language.
- Show a provider’s availability as a schedule comparison, not only raw timestamps.

---

## Recommended Component Plan

The current implementation already has useful starting components. Refactor around responsibilities rather than adding another large container.

| Existing area | Planned role |
| --- | --- |
| `app/customer/jobs/page.tsx` | Replace the general-purpose Activity layout with the new homeowner job workspace. It fetches and renders only `OPEN` and `AWARDED` jobs. |
| `HomeownerOpenJobsCarousel` | Become the compact active-job picker only; remove full job detail/offer content from slides. |
| `HomeownerOpenJobCard` | Split into a compact picker card and a selected-job summary component. |
| `JobActivityTracker` | Power the no-offer/collecting state with real outreach data when available. |
| `BidCard` | Become a homeowner offer row and offer-detail presentation, supporting external providers and all offer types. |
| `ProviderSelectionDrawer` | Become the confirmation step after the offer detail view, not the immediate list-row action. |
| `ActivityScreen` | Remove from `/customer/jobs`; it no longer owns the primary homeowner Jobs experience. Existing detail and message routes remain the transition-safe paths for historical/coordination views. |

New components to introduce during implementation:

```text
HomeownerJobsWorkspace
ActiveJobPicker
SelectedJobSummary
JobMetadataGrid
JobDetailsDisclosure
OffersWorkspace
OfferSortControl
HomeownerOfferRow
HomeownerOfferDetailSheet
AcceptedProviderPanel
```

Keep data fetching in server components. Isolate carousel state, sorting controls, and the mobile offer detail sheet in small client components.

---

## Data Needed by the UI

The screen should read these fields per job:

- Job ID and human-readable reference
- Current lifecycle status
- Posted time, requested date/time, location summary
- Job detail fields for the optional disclosure
- Offer count and normalized provider offers
- Provider name, public rating/review count, offer type, price, schedule fit, notes, and status
- Outreach counts/status only when they represent actual events

Before displaying provider outreach progress, define separate counts for:

- Providers selected for outreach
- Providers actually contacted
- Providers that responded
- Submitted offers

Do not use a single `cleanersNotifiedCount` field as all four concepts.

---

## Implementation Sequence

1. Define the selected-job page model and state matrix for `OPEN` and `AWARDED` jobs; keep completed, expired, and cancelled jobs out of the active picker.
2. Replace the current `/customer/jobs` Activity layout with the workspace shell while retaining the post-job, job-detail, offer-detail, and message routes as valid deep links.
3. Split the current large job presentation into the compact picker and selected-job summary; include the non-interactive `Edit job` tag for open jobs.
4. Build the offer workspace, sorting control, and responsive offer rows.
5. Move final acceptance behind offer details and a confirmation state.
6. Add accepted-provider and no-offer states.
7. Connect real outreach counts once the provider directory/outreach workflow is in place.
8. Test with one, two, and many jobs; zero, one, and many offers; long provider names; estimates; alternate availability; and narrow mobile screens.

---

## Acceptance Criteria

- A homeowner can identify their selected job, requested timing, location summary, and job reference without opening a detail page.
- A homeowner with several active jobs can switch jobs without losing context or scrolling through a previous job’s offers.
- The active-job picker contains only open and awarded jobs; completed, expired, and cancelled jobs do not appear in it.
- The offer list is visible as an independent workspace, not buried inside a tall parent card.
- A homeowner can compare provider, price, offer type, rating, and timing in one scan.
- The list has clear collecting, empty, error, and accepted states.
- Pre-acceptance UI does not expose private homeowner details.
- The screen remains usable at 320px width and with larger text settings.
- Existing job posting, offer acceptance, and job-detail routes continue to work throughout the refactor.
- `/customer/jobs` is the homeowner Jobs workspace, not the former general-purpose Activity screen.
