# Well Kept — Homeowner Post-a-Job Flow Redesign Plan

## Purpose
This document outlines a full redesign plan for the **homeowner-side posting flow** in Well Kept. The goal is to simplify the experience so a homeowner can post a cleaning job with the least possible friction, while making the UI feel more modern, calm, and mobile-native.

The redesign is based on:
- the current Well Kept homeowner screens you shared,
- the earlier UI reference analysis,
- and the product principle that the homeowner flow should be **simple, progressive, and low-effort**.

---

# 1. Executive Summary

## Core recommendation
Redesign the homeowner posting experience into a **single vertical progressive form** inside one primary card.

Instead of moving through multiple dense, separate screens with too many options, the new flow should:
1. open to the homeowner post page,
2. ask for the **address** first,
3. then ask for **date + time window**,
4. then ask for **notes + entry instructions**,
5. then show a **review / post** state.

## Key interaction pattern
Use a **stacked accordion-style flow**:
- Only **one section is expanded at a time**.
- Completed sections **collapse into a compact summary row**.
- The collapsed section stays visible near the top.
- The next section slides in below it.
- Tapping a collapsed section expands it again for editing.
- We do **not** need edit buttons or pencil icons.

This gives the homeowner:
- visibility into progress,
- a sense of control,
- less clutter,
- and a more modern UX.

## Main simplification decision
The homeowner should only provide the essentials:
- **Address**
- **Date**
- **Time slot**
- **Notes / special instructions**
- **Entry instructions**

That’s it.

We should remove or defer:
- complex cleaning type decisions,
- too many scope options,
- too many “state of the home” options,
- supply questions,
- extra branching decisions,
- multiple explanatory cards,
- visible edit icons,
- error states that feel overly form-heavy.

---

# 2. Product Goal

## What the homeowner is trying to do
The homeowner is not trying to “configure a cleaning product.”
They are trying to do one simple thing:

> “I need my place cleaned. Here’s where, when, and anything the cleaner should know.”

The flow should feel more like:
- sending a request,
- setting a delivery window,
- or booking a visit,

and less like:
- filling out a long intake form,
- shopping a service catalog,
- or configuring a marketplace listing.

## UX principle
**Reduce homeowner effort.**
If something is not necessary for the cleaner to bid initially, it should be removed, hidden, inferred later, or made optional.

---

# 3. What’s Working in the Current Flow

## Best current screen: Review / summary
You called out the final review screen as the only one you really like, and that makes sense.

### Why it works
- Strong visual hierarchy
- Clear grouped sections
- Good sense of completion
- Easy to scan
- Feels more polished than the intermediate screens
- Uses summary rows, which is exactly the right direction

This should become the **core layout model** for the whole posting flow.

---

# 4. Problems in the Current Flow

## A. Too many steps and too many decisions
Right now the homeowner is asked to make more decisions than necessary.

Examples:
- cleaning type
- current state of home
- supply ownership
- entry method
- various descriptive options

This introduces friction and decision fatigue.

## B. Too many visible controls at once
Many screens show:
- headings,
- progress bar,
- large card,
- multiple option tiles,
- nested cards,
- buttons,
- warnings,
- bottom nav.

This makes the page feel heavier than it needs to.

## C. Too many boxed UI elements
The current flow uses a lot of:
- bordered rectangles,
- nested cards,
- outlined selection states,
- large inputs with heavy boundaries.

This makes the product feel more like a traditional form UI than a modern consumer app.

## D. The user has to interpret the product structure
The current version makes the user think about:
- what kind of clean,
- how the product categorizes cleaning,
- how to label the home,
- whether supplies matter now,
- how much detail they should provide.

This is internal product logic being pushed onto the user.

## E. Editing affordances are over-explicit
The review screen uses pencil/edit icons. Those are not necessary.
If the section itself is tappable, that is enough.

## F. Error handling is visually heavy
The “choose a future arrival time” error is presented in a way that makes the screen feel more alarming than necessary.
The flow should prevent bad choices more gracefully whenever possible.

---

# 5. Redesign Direction

## High-level concept
Create one **single, vertical, progressive “Post a job” card** where each section behaves like a modern accordion.

### Structure
1. **Address**
2. **When**
3. **Notes & entry**
4. **Review & post**

### Behavior
- One section open at a time
- Completed sections collapse into compact summary rows
- User can tap any collapsed section to reopen it
- Primary CTA advances the flow
- Progress bar remains visible throughout

This merges the strengths of:
- the current review card,
- a progressive form,
- and a clean, touch-first mobile interaction pattern.

---

# 6. Proposed Information Architecture

## New simplified homeowner flow

### Step 1 — Address
Goal: identify where the job is.

#### Inputs
- Address input
- If saved home exists, prefill it
- Option: “Use saved address” / “Enter another address” if needed

#### Output summary when collapsed
- `41 Verdun St, Watervliet, NY 12189`

#### Notes
This should be fast and nearly invisible if the address is already saved.

---

### Step 2 — When
Goal: determine the requested cleaning time.

#### Inputs
- Date selector
- Time window selector

#### Recommended interaction
Use simple, large choice surfaces.

Possible quick-pick date options:
- Today
- Tomorrow
- This weekend
- Pick a date

After date is chosen, show time windows:
- Morning
- Midday
- Afternoon
- Evening
- Flexible

If needed, “Pick a custom time window” can be a secondary path, but do not lead with it.

#### Output summary when collapsed
- `Fri, Sep 4 · Afternoon (1 PM–4 PM)`

#### Key simplification
Do **not** ask homeowners for precise appointment times upfront unless absolutely necessary.
A time window is better than an exact time.

That reduces friction and better fits how cleaners actually schedule work.

---

### Step 3 — Notes & Entry
Goal: capture only the information a cleaner needs before bidding or showing up.

#### Inputs
Use only two text areas / grouped fields:

1. **Anything cleaners should know?**
   Placeholder examples:
   - Focus on kitchen and bathrooms
   - Pet in home
   - Please avoid guest room
   - Parking is on the street

2. **How should the cleaner enter?**
   Placeholder examples:
   - I’ll be home
   - Door code 1234
   - Call on arrival
   - Key with front desk

#### Optional enhancement
This can be shown as two stacked inputs, or one can be a simple selector plus optional notes.
But keep it visually light.

#### Output summary when collapsed
- `Notes added`
- `I’ll be home · Parking on street`

or if blank:
- `No extra instructions`

---

### Step 4 — Review & Post
Goal: reassure the user and give them a final chance to confirm.

#### Show four summary rows
- Address
- When
- Notes
- Entry

Each row is tappable.
No pencil/edit icon required.

#### CTA
- `Post cleaning job`

#### Supporting text
- `No payment today. Cleaners will send prices and availability.`

This is strong and should remain.

---

# 7. Detailed Interaction Model

## A. Vertical accordion behavior
This is the core of the new experience.

### Expanded state
When a section is active, it shows:
- section label,
- large prompt/question,
- relevant controls,
- primary continue CTA.

### Collapsed state
When completed, the section shrinks into a compact summary tile.

Example:

**Address**

41 Verdun St, Watervliet, NY 12189

**When**

Fri, Sep 4 · Afternoon

**Notes & entry**

I’ll be home · Focus on kitchen and bathrooms

### Expansion rules
- Tapping a collapsed section expands it.
- The currently open section closes.
- The transition should animate smoothly.

## B. Continue action
Each step should have a single primary action:
- Continue
- Next
- Review job
- Post cleaning job

Avoid multiple competing buttons.

## C. Back behavior
We do not need a separate back button inside every step if the accordion structure is clear.
The user can tap a previous section to revisit it.

If a back button exists, it should be subtle and secondary.

## D. Error handling
Prefer **preventive UX** over visible error banners.

Examples:
- Disable impossible past times
- Hide unavailable options
- Use inline helper text only when necessary

If an error must be shown, keep it compact and calm.

---

# 8. Visual / UI Design Recommendations

## Overall visual direction
Adopt the cleaner, softer, more modern principles from the reference analysis:
- fewer boxes,
- fewer nested cards,
- larger rounded surfaces,
- stronger type hierarchy,
- more whitespace,
- one clear action at a time.

## A. Use the review card as the base template
The review screen already has the right architecture:
- grouped rows,
- clean sectioning,
- clear hierarchy.

Instead of saving that layout only for the end, use it throughout the flow.

## B. One main card, not many separate screens feeling unrelated
The card should persist while the content inside changes.
That creates continuity.

## C. Reduce component noise
Avoid:
- lots of outlined mini cards,
- stacked nested boxes,
- too many icons,
- redundant labels.

Prefer:
- section header,
- one clear prompt,
- 2–4 large choices,
- a concise summary line.

## D. Remove visible edit icons
Use direct manipulation.
If the row is tappable, the whole row becomes the edit affordance.

## E. Keep a strong progress bar
The progress bar is useful.
Keep:
- step count (`02 / 04` or `02 / 05` if review remains separate),
- visual fill,
- placement near the top of the card.

But simplify the rest of the header chrome.

## F. Buttons
Use one dominant green CTA.
Secondary actions should be much quieter.

Examples:
- Continue
- Review job
- Post cleaning job

Avoid disabled states that feel muddy or too low-contrast unless truly necessary.

---

# 9. Proposed Step Count

## Recommendation: 4 steps total
1. Address
2. When
3. Notes & entry
4. Review

If address is already saved and confirmed, the UI can visually still count it as step 1, but it may be completed almost instantly.

### Why 4 steps is better than 5
A 5-step flow suggests more complexity than is necessary. The homeowner should feel like posting is quick.

If you want to preserve the current visual rhythm, you can keep 5 total progress states by splitting `When` into:
- date,
- time window,

but conceptually it should still feel like a single section.

My recommendation is to move to **4 total steps**.

---

# 10. Screen-by-Screen Redesign Notes

## Current initial homeowner page
### Current issues
- Large headline is good, but the page likely still feels like a landing layer separate from the actual form.
- There is some duplication between page intro and the actual card flow.

### Recommendation
The initial homeowner page should directly lead into the posting card.

#### Preferred structure
- Well Kept logo
- Headline: `What do you need cleaned?`
- Supporting line: `Tell us where and when. Cleaners will send prices.`
- Posting card begins immediately below

No extra explanation blocks.

---

## Current Date & Time screen
### What to change
- Keep the big heading.
- Keep the progress bar.
- Simplify the date choices.
- After date choice, reveal time windows below.
- Do not use a large nested “arrival time” card unless needed.
- Avoid exact-time input as the primary interaction.

### Better pattern
- Quick-pick date row
- Quick-pick time window row
- Optional “Pick custom time” link or secondary action

---

## Current Cleaning Scope screen
### Recommendation
Remove this entire step from the homeowner MVP flow.

If needed internally, default to a generic classification like:
- `Home cleaning request`

Later, cleaners or internal logic can interpret or clarify details from notes.

If the business truly needs one scope input, reduce it to a single simple choice:
- Standard clean
- Deep clean
- Move-out clean

But ideally this is removed for MVP.

---

## Current Arrival Details screen
### Recommendation
Collapse and simplify heavily.

Current questions like:
- How will the cleaner enter?
- Who provides supplies?
- Entry instructions
- Anything else cleaners should know?

should be simplified to:
- Entry instructions
- Notes

Do not ask about supplies on the homeowner side for MVP.
If cleaners need to know, they can ask or interpret through later messaging.

---

## Current Summary screen
### Recommendation
Keep this as the visual foundation.

Refine it by:
- removing edit icons,
- making rows tappable,
- shortening labels,
- simplifying copy,
- optionally showing fewer icons.

---

# 11. Suggested New UI Structure

## Top area
- Logo
- Headline
- Short subheadline

## Main card
Persistent rounded card containing:
- progress bar
- active section
- collapsed completed sections
- CTA area

## Bottom navigation
Keep it simple:
- Account
- Post
- Activity

The bottom nav is okay, but it should visually sit separate from the form and not compete with the primary CTA.

---

# 12. Component Recommendations

## 1. Collapsed summary row
Should include:
- section title
- summary value
- subtle chevron or no icon at all

Examples:

**Address**

41 Verdun St, Watervliet, NY 12189

**When**

Fri, Sep 4 · Afternoon

**Notes & entry**

I’ll be home · Notes added

## 2. Expanded section block
Should include:
- small uppercase section label
- large prompt
- inputs/options
- primary CTA

## 3. Quick-select buttons
Use for:
- Today / Tomorrow / This weekend / Pick a date
- Morning / Midday / Afternoon / Evening / Flexible

These should be:
- large touch targets,
- rounded,
- clear selected state,
- visually soft.

## 4. Text areas
Use only where necessary.
- One for notes
- One for entry instructions

Keep placeholders concise and helpful.

## 5. Tappable review rows
No pencil icon required.
A row tap opens that section.

---

# 13. Copy Recommendations

## Headline
Use one consistent headline:
- `What do you need cleaned?`

## Subheadline
- `Tell us where and when. Cleaners will send prices.`

## Step copy

### Address
- Label: `ADDRESS`
- Prompt: `Where should cleaners go?`

### When
- Label: `DATE & TIME`
- Prompt: `When would you like it cleaned?`

### Notes & entry
- Label: `NOTES & ENTRY`
- Prompt: `Anything cleaners should know?`

### Review
- Label: `SUMMARY`
- Prompt: `Ready to post your job?`

## CTA copy
- `Continue`
- `Review job`
- `Post cleaning job`

## Reassurance copy
- `No payment today. You choose a cleaner after reviewing prices.`

---

# 14. Interaction and Motion Guidelines

## Motion style
Use subtle, native-feeling motion:
- section collapse/expand,
- slide/fade transitions,
- smooth height animation,
- no dramatic movement.

## Behavior expectations
- After section completion, collapse it automatically.
- Scroll the next expanded section into view.
- Preserve user input while navigating between sections.
- Tapping a summary row should reopen the section inline.

## Why this matters
The motion should make the flow feel guided, not fragmented.

---

# 15. Validation Rules

## Address
- Required
- Must be a valid entered or selected address

## When
- Required
- Must be future date/time
- Prefer selectable valid windows over manual validation

## Notes & entry
- Optional overall, but at least one entry field is encouraged
- If blank, summary can show `No extra instructions`

## Review
- Post CTA enabled once required sections are complete

---

# 16. What to Remove from MVP

Remove or defer the following from the homeowner-side posting flow:
- cleaning condition classification beyond what is absolutely necessary,
- multiple cleaning scope cards,
- move-in / deep clean branching unless truly required,
- supply ownership question,
- separate edit icons,
- exact-time-first interaction,
- heavy inline error cards,
- extra helper copy that clutters the card.

---

# 17. Recommended Final MVP Flow Example

## Open app
User lands on homeowner post page.

### Page intro
**What do you need cleaned?**

Tell us where and when. Cleaners will send prices.

---

## Section 1 — Address (expanded)
User enters or confirms address.
Tap `Continue`.

Section collapses to:

**Address**

41 Verdun St, Watervliet, NY 12189

---

## Section 2 — When (expanded)
User picks:
- Tomorrow
- Afternoon

Tap `Continue`.

Section collapses to:

**When**

Tomorrow · Afternoon

---

## Section 3 — Notes & entry (expanded)
User adds:
- `Please focus on kitchen and bathrooms.`
- `I’ll be home. Call on arrival.`

Tap `Review job`.

Section collapses to:

**Notes & entry**

I’ll be home · Focus on kitchen and bathrooms

---

## Section 4 — Review (expanded)
User sees all summary rows.
Taps `Post cleaning job`.

Confirmation copy:
- `No payment today. Cleaners will send prices and availability.`

---

# 18. Implementation Guidance for Dev

## Build approach
Treat this as a **single screen with internal section state**, not as 4–5 completely separate pages.

### Recommended state model
Each section has:
- status: `locked | active | complete`
- value: stored data
- summary text: collapsed preview

### Rendering pattern
Render sections in a vertical stack:
1. completed sections first (collapsed),
2. current active section expanded,
3. future sections hidden or lightly previewed.

### Editing pattern
- Clicking/tapping a completed section makes it active.
- Previously active section stays complete if still valid.

### Progress pattern
Progress bar updates based on the farthest completed section.

---

# 19. Acceptance Criteria

The redesign is successful if:
- A homeowner can post a job with only address, time, and instructions.
- The flow feels shorter and less cluttered than today.
- Only one main task is visible at a time.
- Completed sections collapse into readable previews.
- Any previous section can be edited by tapping it.
- No edit icons are required.
- The review screen remains strong and becomes the model for the flow.
- The visual style feels more modern, calmer, and more mobile-native.

---

# 20. Final Recommendation

## Bottom line
The homeowner flow should become a **simple vertical posting workflow** built around the visual structure of the current review screen.

### Final product principle
The user should feel like they are doing this:

> Confirm address → pick time → add notes → post.

Not this:

> configure a multi-step service form.

### Best redesign move
Take the **summary/review layout you already like** and turn it into the actual structure of the full flow:
- one section open at a time,
- previous sections collapsed above,
- tap to expand and edit,
- simple previews,
- persistent progress bar,
- minimal required information.

That is the right homeowner MVP.

---

# 21. Suggested Next Build Priority

## Phase 1
Ship the simplified homeowner post flow with:
- Address
- When
- Notes & entry
- Review

## Phase 2
After observing usage, optionally add:
- optional home profile,
- suggested clean type,
- AI rewrite of homeowner notes for cleaner-facing summary,
- cleaner-facing structured interpretation,
- saved preferences.

For now, do **not** add more homeowner complexity.
