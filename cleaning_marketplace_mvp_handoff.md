# Cleaning Marketplace MVP - Finalized Proof of Concept Plan

## 1. Product Thesis

This product should look like a marketplace to the customer, but run like a tightly managed service business behind the scenes.

The proof of concept is successful if it proves all of the following:

- a new customer can book a cleaning with confidence in a few minutes
- operations can manually fulfill every booking without chaos
- a cleaner can do the job from a phone without friction
- status changes are visible and reassuring to all parties
- the product feels trustworthy enough that people would use it again

This is not a full marketplace launch. It is a polished, operationally safe POC.

---

## 2. Experience Analysis

## 2.1 Customer Viewpoint

A customer deciding whether to book a cleaner is mainly asking:

- "Do you service my area?"
- "What exactly am I buying?"
- "How much will it cost?"
- "Can I trust that someone will actually show up?"
- "What happens if I need help or plans change?"

The current plan covered the mechanics, but it underweighted the emotional side of the purchase. For the POC to feel good, the customer experience needs:

- fast eligibility and pricing clarity
- clear service descriptions and what is included
- obvious trust signals before payment
- a short booking flow with no dead ends
- a calm post-booking status page that answers "what happens next?"
- a visible support path without forcing the customer to hunt for help

## 2.2 Cleaner Viewpoint

A cleaner using the app on the day of service is mainly asking:

- "What job am I doing next?"
- "Where am I going?"
- "How do I get in?"
- "What did the customer ask for?"
- "What is the one next action I should take?"
- "How do I get help if there is a problem?"

The current plan asked cleaners to manage more system behavior than this POC needs. For the cleaner experience to feel good, the product should prioritize:

- a phone-first job list
- one-tap job progression
- large action buttons and minimal typing
- clear arrival and access notes
- direct support contact from every job screen
- simple availability controls instead of a full scheduler

## 2.3 Resulting Product Decisions

Based on those two viewpoints, the finalized POC should make these decisions:

- Use managed dispatch, not an open marketplace. Customers book a service, then ops assigns the cleaner.
- Keep the customer flow to a single booking wizard plus a booking detail page.
- Do not build self-serve rescheduling in v1. Let customers request help through support.
- Do not build cleaner self-claiming of open jobs.
- Do not build a complex cleaner calendar. Start with a simple availability toggle plus admin-managed scheduling.
- Do not spend time on admin CRUD screens that do not improve the demo. Seed service catalog and pricing if needed.
- Do show cleaner assignment, status timeline, and support contact clearly, because those are what make the product feel real.

---

## 3. What "Feels Good" Means For This POC

The product should meet these practical experience goals:

- A customer can complete a first-time booking on mobile in under 3 minutes.
- The price feels predictable. There are no surprise fees after the quote screen.
- The confirmation screen explains exactly what happens next.
- The booking detail page always shows a useful current status and next expectation.
- A cleaner can complete the full job flow from a phone with almost no typing.
- Ops can assign a cleaner to a paid booking in under 60 seconds.
- No screen leaves the user wondering what to do next.

---

## 4. Final POC Scope

## 4.1 In Scope

### Customer

- marketing landing page
- service area check
- service selection
- property details
- add-ons
- date and time window selection
- quote review
- email or phone-based authentication at checkout
- Stripe payment
- booking confirmation
- booking detail page with live status
- booking history
- cancellation within policy
- visible support contact

### Cleaner

- invite-only onboarding
- login
- mobile-first dashboard
- assigned jobs list
- job detail page
- one-tap status updates: en route, arrived, started, completed
- simple availability toggle
- job history
- support contact from job screen

### Admin / Ops

- bookings list
- booking detail page
- manual assign and reassign
- cleaner roster
- availability visibility
- cancellation handling
- internal notes
- basic service area and slot management

## 4.2 Explicitly Out Of Scope

- auto-dispatch or matching
- open job claiming by cleaners
- route optimization
- in-app chat
- ratings and reviews
- recurring subscription billing
- promotions or referral systems
- customer tipping
- payroll or contractor payout automation
- live map tracking
- photo-based quoting
- customer self-serve rescheduling
- deep admin CMS-style configuration tools

## 4.3 Important Simplifications

- Bookings use fixed time windows, not exact arrival times.
- Ops stays in control of assignment.
- Cleaner scheduling is simple in v1.
- Communication is transactional, not conversational.
- The product should look premium on the surface and stay simple underneath.

---

## 5. Recommended Stack

For the proof of concept, stop presenting multiple architecture options and pick the fastest stack that still feels production-like.

### Final Recommendation

- Frontend and server layer: Next.js App Router
- Hosting: Vercel
- Database: Supabase Postgres
- Auth: Supabase Auth with magic link or OTP
- Payments: Stripe Checkout
- Email: Resend
- SMS: Twilio only after core flows are stable
- Maps and autocomplete: Google Places or Mapbox Geocoding

### Why This Stack

- One codebase reduces coordination overhead.
- Supabase gives auth plus Postgres quickly.
- Stripe Checkout is fast to ship and trusted by customers.
- Next.js route groups can support customer, cleaner, and admin surfaces cleanly.
- This stack is enough for a polished POC without introducing backend sprawl.

### App Structure

Use one Next.js app with route groups:

```text
/app
  /(marketing)
  /(customer)
  /(cleaner)
  /(admin)
/components
/lib
/supabase
/emails
```

Use server actions or route handlers for mutations that require auth or side effects.

---

## 6. Product Strategy

This product is not "Uber for cleaners" at POC stage.

It is:

- a customer-facing booking experience
- an operations-controlled dispatch system
- a cleaner execution app

The most important product decision is this:

- never let backend complexity leak into the experience

Customers should feel they are booking a reliable professional service.
Cleaners should feel they are using a simple field tool.
Ops should feel they can see the whole business in one place.

---

## 7. Roles And Permissions

| Capability | Customer | Cleaner | Admin |
|---|---:|---:|---:|
| Start booking | Yes | No | Optional |
| View own bookings | Yes | No | Yes |
| View assigned jobs | No | Yes | Yes |
| Update job status | No | Yes | Yes |
| Assign or reassign cleaner | No | No | Yes |
| Cancel booking | Limited | No | Yes |
| Manage service areas and slots | No | No | Yes |
| Manage cleaners | No | No | Yes |

For the POC, a separate super-admin role is not required. Admin can own internal operations.

---

## 8. Core Business Rules

- A customer must be inside an active service area before seeing bookable slots.
- A booking is only live after successful payment.
- A paid booking can exist without an assigned cleaner.
- Only admin can assign or reassign cleaners.
- A cleaner can only update bookings assigned to them.
- A cleaner cannot be assigned to overlapping bookings.
- Customers can cancel before a configured cutoff. After that, support or admin intervention is required.
- Every important booking state change must be logged.
- The final quoted price is stored on the booking and never recomputed historically.

---

## 9. Experience Principles

## 9.1 Customer Principles

- Explain the service in plain language.
- Show pricing before asking for payment.
- Keep steps short and obvious.
- Use reassuring, operational copy like "You will receive confirmation right away."
- Show a real support path on confirmation and booking detail pages.

## 9.2 Cleaner Principles

- Design for one hand on a phone.
- Put the next action at the bottom of the screen.
- Reduce typing to optional notes only.
- Make address, entry notes, and add-ons impossible to miss.
- Always provide a direct way to contact ops.

## 9.3 Admin Principles

- The default view should answer: what is unassigned, what is at risk, what needs action now.
- Booking detail should show everything relevant on one page.
- Manual dispatch should feel fast, not like a workaround.

---

## 10. Customer Experience Plan

## 10.1 Landing Page

Purpose:

- establish trust
- explain the service quickly
- start the booking flow immediately

Required sections:

- hero with clear value proposition
- primary CTA: Book a Cleaning
- service area checker
- services preview
- "what's included" section
- trust section
- FAQ
- support contact

Trust signals should include:

- insured and vetted team messaging if true
- transparent pricing language
- satisfaction or support promise
- local service area framing

## 10.2 Booking Flow

The customer booking flow should be a guided wizard, not a long form.

### Step 1: Address And Coverage

Fields:

- address autocomplete
- apartment or unit
- access notes

System behavior:

- validate service area immediately
- if out of area, show a graceful unavailable state and capture interest for follow-up

### Step 2: Service Selection

Show a small set of service cards:

- Standard Clean
- Deep Clean
- Move In / Move Out

Each card should show:

- clear description
- starting price
- estimated time range
- what the service is best for

Do not overwhelm the customer with too many service options in v1.

### Step 3: Home Details

Fields:

- property type
- bedrooms
- bathrooms
- optional square footage
- pets yes or no
- special instructions

This step should explain why details are being collected:

- "We use this to estimate time, staffing, and price."

### Step 4: Add-Ons

Examples:

- inside fridge
- inside oven
- laundry fold
- pet hair treatment

Each add-on should show:

- price delta
- optional time impact
- short plain-language explanation

### Step 5: Date And Time Window

Use fixed windows such as:

- 9:00 AM - 12:00 PM
- 1:00 PM - 4:00 PM

The UI should communicate this clearly:

- "Arrival happens within this service window."

Do not promise exact cleaner ETA at booking time.

### Step 6: Quote Review

Show:

- service
- home details
- add-ons
- scheduled window
- subtotal
- taxes
- total
- cancellation summary

This screen is where customer confidence is won or lost. It should feel calm, complete, and final.

### Step 7: Auth And Payment

For the POC, use low-friction auth:

- email magic link or OTP
- optionally collect phone number for notifications

Then send the customer into Stripe Checkout.

Why:

- less password friction
- less auth drop-off
- enough account structure for booking history later

### Step 8: Confirmation

The confirmation page must include:

- booking reference
- service summary
- address
- booked window
- payment confirmation
- "What happens next" section
- support contact
- button to view booking

The "What happens next" section should say:

- your booking is confirmed
- we will assign your cleaner and notify you
- you can track status from your booking page

## 10.3 Booking Detail Page

This page matters almost as much as checkout.

Required content:

- current booking status
- timeline of completed and upcoming states
- cleaner card once assigned
- full service summary
- address and entry notes
- payment summary
- cancellation policy
- support contact

Allowed actions:

- cancel booking if before cutoff
- request help

Do not build self-serve rescheduling in the POC. It adds complexity in scheduling, payments, and ops logic without meaningfully improving the demo.

## 10.4 Booking History

Tabs:

- Upcoming
- Completed
- Cancelled

Each card should make it easy to recognize the booking at a glance:

- date
- service type
- address nickname or short address
- status

---

## 11. Cleaner Experience Plan

## 11.1 Cleaner Onboarding

Cleaner onboarding should be invite-only for the POC.

Flow:

1. Admin creates cleaner record.
2. Cleaner receives invite.
3. Cleaner signs in and confirms profile basics.
4. Cleaner lands in mobile dashboard.

Required profile fields:

- first name
- last name
- phone
- home service area or base location
- availability toggle

Do not build a long multi-step contractor onboarding flow inside the product.

## 11.2 Cleaner Dashboard

The cleaner dashboard should default to "Today."

Sections:

- Current or next job
- Today's jobs
- Upcoming jobs
- availability toggle
- support shortcut

The page should answer three questions immediately:

- what is next
- where is it
- what do I need to do now

## 11.3 Job Detail

This is the most important cleaner screen.

It should show, in order:

- status
- service window
- address
- button to open in maps
- customer first name
- property details
- add-ons
- entry instructions
- special notes
- support actions

Primary actions should be sticky and large:

- Mark En Route
- Mark Arrived
- Start Cleaning
- Complete Job

Optional secondary actions:

- call support
- text support

The cleaner should not need to hunt for the address or instructions.

## 11.4 Completion Flow

When marking completed:

- require confirmation
- capture completion timestamp
- optionally capture short completion note
- return the cleaner to the job list

Do not require photo upload for the POC.

## 11.5 Availability

Keep this intentionally simple in v1:

- available for assignments on or off
- optional blocked dates if time allows

Do not build a full recurring availability calendar for the POC.

## 11.6 Cleaner History

Show completed jobs with:

- date
- address
- service type
- status

If cleaner payout visibility matters operationally, handle it outside the app for v1 unless the business already has a settled payout model.

---

## 12. Admin And Ops Experience Plan

## 12.1 Ops Dashboard

The default admin surface should behave like a dispatch board, not just a table.

At minimum it should show:

- New paid bookings needing assignment
- Today's assigned jobs
- Jobs in progress
- At-risk bookings
- Recently completed jobs

Key summary stats:

- bookings today
- unassigned paid bookings
- cleaners currently available
- jobs in progress

## 12.2 Booking List

Required columns:

- booking reference
- customer
- short address
- service
- scheduled window
- cleaner
- booking status
- payment status
- created time

Required filters:

- date
- status
- assigned cleaner
- service type

The main operational need is to find unassigned paid bookings quickly.

## 12.3 Booking Detail

This page must combine customer context, fulfillment context, and financial context.

Show:

- customer info
- property and access info
- service and add-ons
- booking timeline
- payment status
- cleaner assignment panel
- internal notes
- support/cancellation actions

Actions:

- assign cleaner
- reassign cleaner
- cancel booking
- update internal notes

## 12.4 Cleaner Roster

Show:

- cleaner name
- active status
- available for assignments yes or no
- today's assigned job count
- current job status if applicable

Do not spend early time on elaborate cleaner analytics.

## 12.5 Catalog And Pricing Management

For the POC, this does not need to be a polished admin UI on day one.

Recommended approach:

- seed services and add-ons in the database
- build minimal internal editing only if needed after core flows are working

This is a deliberate scope cut. Booking, dispatch, and cleaner usability matter more than admin content tools.

## 12.6 Exceptions And Edge Cases

Admin must be able to handle:

- cancellation requests
- cleaner reassignment
- customer no-answer or access issue notes
- payment issue review
- stalled jobs

---

## 13. Core Screen Inventory

### Customer

- `/`
- `/book`
- `/book/confirm`
- `/account/bookings`
- `/account/bookings/[id]`

### Cleaner

- `/cleaner`
- `/cleaner/jobs/[id]`
- `/cleaner/history`

### Admin

- `/admin`
- `/admin/bookings`
- `/admin/bookings/[id]`
- `/admin/cleaners`

---

## 14. Booking Status Model

Use a small, controlled state machine.

### Internal Statuses

- `pending_payment`
- `booked`
- `assigned`
- `en_route`
- `arrived`
- `in_progress`
- `completed`
- `cancel_requested`
- `cancelled`
- `payment_failed`

### Allowed Flow

```text
pending_payment
  -> booked
  -> assigned
  -> en_route
  -> arrived
  -> in_progress
  -> completed
```

### Cancellation Paths

- `pending_payment -> cancelled`
- `booked -> cancelled`
- `assigned -> cancelled`

### Rules

- Only admin can move a booking into `assigned`.
- Only the assigned cleaner or admin can move job-progress states forward.
- `completed` requires `in_progress` first.
- `cancelled` is terminal except for refund bookkeeping.

### Display Labels

Do not show raw enum values to users.

Map them to user-facing language such as:

- `booked` -> Booked
- `assigned` -> Cleaner assigned
- `en_route` -> On the way
- `arrived` -> Arrived
- `in_progress` -> Cleaning in progress
- `completed` -> Completed

---

## 15. Notifications And Communication

## 15.1 Required For POC

Email notifications:

- booking confirmed
- cleaner assigned
- cleaner on the way
- booking completed
- booking cancelled

Cleaner notifications:

- new assignment
- reassignment
- cancellation

## 15.2 Nice To Have After Core Flows Are Stable

- SMS for customer day-of notifications
- SMS for cleaner assignment alerts

## 15.3 Support

Every booking confirmation, booking detail page, and cleaner job detail page should show a visible support action.

Minimum:

- phone number
- email or text support fallback

This is important to perceived reliability.

---

## 16. Pricing And Scheduling Logic

## 16.1 Pricing

Use deterministic rules.

Recommended formula:

```text
Total =
Base service price
+ home size adjustments
+ add-ons total
- discounts if any
+ tax
```

Example logic:

- Standard Clean base: $120
- Deep Clean base: $180
- Add $20 per bathroom over 1
- Add $25 per bedroom over 2
- Add add-ons directly
- Apply tax

Persist the full quoted breakdown on the booking record at purchase time.

## 16.2 Scheduling

Use fixed service windows and simple capacity rules.

Recommended model:

- a slot table per day and service window
- each slot has capacity
- bookings decrement capacity
- admin can override when needed

Do not build dynamic route-based scheduling for the POC.

---

## 17. Data Model Essentials

The original document included a full schema. For the finalized POC, the key requirement is not more tables, it is the right tables.

## 17.1 Core Entities

### `users`

- id
- role: `customer`, `cleaner`, `admin`
- first_name
- last_name
- email
- phone
- is_active
- created_at
- updated_at

### `customer_profiles`

- user_id
- default_address_id
- marketing_opt_in

### `cleaner_profiles`

- user_id
- is_available
- status: `active`, `inactive`
- service_radius_miles
- internal_notes

### `addresses`

- id
- user_id
- street_1
- street_2
- city
- state
- postal_code
- latitude
- longitude
- access_notes

### `properties`

- id
- customer_id
- address_id
- property_type
- bedrooms
- bathrooms
- square_feet
- has_pets
- entry_instructions
- special_notes

### `services`

- id
- slug
- name
- description
- base_price
- estimated_duration_minutes
- is_active

### `service_add_ons`

- id
- slug
- name
- description
- price
- duration_minutes
- is_active

### `service_areas`

- id
- name
- postal_code or geography reference
- is_active

### `booking_slots`

- id
- slot_date
- window_start
- window_end
- capacity
- is_active

### `bookings`

- id
- booking_reference
- customer_id
- property_id
- service_id
- cleaner_id nullable
- slot_id
- scheduled_start
- scheduled_end
- status
- subtotal
- add_on_total
- tax_amount
- total_amount
- payment_status
- customer_notes
- admin_notes
- cancelled_at
- completed_at
- created_at
- updated_at

### `booking_add_ons`

- booking_id
- add_on_id
- quantity
- unit_price
- total_price

### `payments`

- booking_id
- provider
- provider_reference
- amount
- currency
- status
- paid_at

### `booking_events`

- booking_id
- event_type
- old_status
- new_status
- actor_user_id
- note
- created_at

This table matters because it gives a single audit trail for status, assignment, and support-relevant events.

---

## 18. Application Modules

Whether implemented as route handlers, server actions, or service files, the product should have these modules:

- auth
- service catalog
- service area validation
- slot availability
- quoting
- bookings
- payments
- notifications
- cleaner actions
- admin assignment

Recommended route handler surface:

- `POST /api/quote`
- `POST /api/bookings`
- `POST /api/stripe/create-checkout-session`
- `POST /api/webhooks/stripe`
- `POST /api/bookings/[id]/cancel`
- `POST /api/admin/bookings/[id]/assign`
- `POST /api/admin/bookings/[id]/reassign`
- `POST /api/cleaner/bookings/[id]/status`

Keep the API small and centered on real user actions.

---

## 19. Build Order

## Phase 1 - Foundations

- set up Next.js app, Supabase, and auth
- seed service catalog, service areas, and slots
- define booking and payment schema
- create shared design system primitives

## Phase 2 - Customer Booking Flow

- landing page
- booking wizard
- quote logic
- Stripe Checkout
- confirmation page

## Phase 3 - Customer Post-Booking Experience

- booking detail page
- booking history
- email notifications
- cancellation flow

## Phase 4 - Admin Ops

- dispatch dashboard
- bookings list
- booking detail
- manual assignment and reassignment
- cleaner roster

## Phase 5 - Cleaner Experience

- cleaner login
- mobile dashboard
- job detail page
- one-tap status updates
- job history

## Phase 6 - Polish

- loading states
- empty states
- better copy
- support placement
- optional SMS
- analytics events

Important sequencing note:

- do not build advanced admin configuration before booking, dispatch, and cleaner execution are working end to end

---

## 20. Acceptance Criteria

The POC is ready when the team can demonstrate this end-to-end flow without manual patchwork:

1. A first-time customer lands on the site, checks coverage, books a service, and pays.
2. The customer immediately sees a confirmation page and can open a booking detail page.
3. Admin sees the paid booking and assigns a cleaner quickly.
4. The cleaner receives the assignment, opens the job on a phone, and progresses the job through all major states.
5. The customer sees status updates reflected on their booking page.
6. The booking ends in a clean completed state with full event history.

Additional acceptance checks:

- booking creation is blocked outside service area
- price shown before payment matches recorded total
- overlapping cleaner assignment is prevented
- cancellation rules are enforced
- every important state change is visible in admin

---

## 21. QA Scenarios

### Customer

- can complete booking on mobile without layout issues
- can leave and resume after auth
- sees clear error if payment fails
- sees correct status after confirmation
- can cancel before cutoff

### Cleaner

- sees only assigned jobs
- can progress states in order only
- can open maps from job detail
- can contact support from job detail

### Admin

- sees new paid bookings quickly
- can assign and reassign without page confusion
- can identify unassigned jobs at a glance
- can cancel or note exceptions

### Edge Cases

- payment succeeds but webhook is delayed
- slot fills while customer is checking out
- cleaner is reassigned after assignment
- cancelled booking cannot continue through cleaner statuses
- stale session or expired auth on mobile

---

## 22. Analytics Events

Track the funnel and operations from day one.

Suggested events:

- booking_started
- service_area_passed
- service_selected
- home_details_completed
- slot_selected
- quote_viewed
- checkout_started
- payment_success
- booking_confirmed
- cleaner_assigned
- cleaner_en_route
- booking_completed
- booking_cancelled

These events are enough to spot funnel friction and ops bottlenecks early.

---

## 23. Future Releases, Not POC

- recurring plans
- reviews
- self-serve rescheduling
- auto-dispatch
- live tracking
- customer tipping
- promo codes
- payout automation
- chat
- photo upload
- advanced cleaner performance reporting

---

## 24. Final Summary

The finalized MVP should be treated as a managed cleaning service with three tightly designed surfaces:

- a fast customer booking flow
- a simple cleaner execution app
- a practical dispatch dashboard

The biggest changes from the earlier draft are intentional:

- fewer architecture choices
- fewer admin tools up front
- less cleaner scheduling complexity
- more emphasis on trust, status clarity, and support

That is the right tradeoff for a proof of concept that needs to feel real, not just complete.

---

## 25. Immediate Next Deliverables

Build these next, in order:

1. low-fidelity wireframes for all customer, cleaner, and admin core screens
2. database schema and Supabase setup
3. quote and booking flow implementation
4. admin assignment flow
5. cleaner job execution flow
