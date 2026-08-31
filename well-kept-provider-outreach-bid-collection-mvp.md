# Well Kept — Provider Outreach & Bid Collection MVP Plan

## 1. Product Goal

Well Kept is primarily a **homeowner-facing marketplace experience**.

The homeowner should be able to:

1. Post a home cleaning job once.
2. Specify what they need and when they need it done.
3. Have Well Kept automatically identify and contact strong nearby cleaners.
4. Receive cleaner responses, pricing, availability, and quote options in one organized place.
5. Compare offers and select the cleaner they want.
6. Once an offer is accepted, receive the cleaner's contact information and a shared Well Kept job reference number.

The cleaner should **not need to download the Well Kept app or create an account** in order to receive a lead or submit an offer.

For the MVP, cleaners can participate through:

- Twilio SMS
- A lightweight mobile web form
- Natural-language SMS replies as a fallback

The provider-side app can remain optional and can be expanded later if Well Kept introduces provider subscriptions or workflow tools.

---

# 2. Core Product Principle

## Homeowners use the product. Providers participate through whatever channel is easiest.

Well Kept should act as the intermediary that:

- Finds local providers
- Reaches out
- Collects responses
- Normalizes those responses
- Presents them clearly to the homeowner
- Connects the parties after an offer is accepted

The cleaner should not need to learn a new workflow.

Their experience can be as simple as:

> Receive text → review job → submit price and availability → get connected if selected.

---

# 3. MVP User Flow

## Homeowner

```text
Post Job
   ↓
Well Kept identifies nearby cleaners
   ↓
Twilio sends job opportunity by SMS
   ↓
Cleaners respond
   ↓
Responses become structured offers
   ↓
Offers appear in homeowner app
   ↓
Homeowner accepts an offer
   ↓
Well Kept reveals contact information
   ↓
Homeowner + cleaner connect directly
```

---

# 4. Job Creation

The homeowner posts the job through the existing Well Kept homeowner experience.

At minimum, each cleaning job should capture:

### Required

- Job reference number
- Service type
- Address
- City / ZIP
- Requested date
- Requested time or time window
- Bedrooms
- Bathrooms
- Approximate square footage
- Cleaning type
- Homeowner notes

### Optional

- Pets
- Parking notes
- Entry instructions
- Supplies available
- Photos
- Additional service requests

Example:

```text
Job: WK-1842

Service:
Standard Home Cleaning

Location:
Watervliet, NY 12189

Home:
3 Bed
2 Bath
1,450 sq ft
1 Dog

Schedule:
Thursday, September 3
Anytime after 3:00 PM

Notes:
Kitchen and bathrooms need the most attention.
```

---

# 5. Cleaner Discovery

When a job is posted, Well Kept should identify the best nearby cleaning businesses.

Initial provider data can come from public/local business sources and later from claimed Well Kept profiles.

Store fields such as:

```text
Provider ID
Business Name
Google Business Profile ID
Phone
Email
Website
Rating
Review Count
Address
Service Area
Distance From Job
Services Offered
Well Kept Status
Previous Response Rate
Previous Acceptance Rate
Average Response Time
```

## Initial Ranking Factors

A simple first-pass ranking could consider:

- Distance from job
- Google rating
- Number of reviews
- Service match
- Previous Well Kept response rate
- Previous Well Kept acceptance rate

The first version does not need a sophisticated machine learning model.

A weighted score is sufficient.

Example:

```text
30% Distance
25% Google Rating
20% Review Count
15% Previous Response Rate
10% Previous Well Kept Performance
```

For a new market, Google rating, review count, distance, and service relevance will carry most of the weight.

---

# 6. Outreach Strategy

For the MVP, use **Twilio SMS as the primary outbound channel**.

The objective is to give the cleaner enough information in the text itself to decide whether the job is relevant without requiring them to open anything first.

## Example SMS

```text
New Well Kept cleaning job #WK-1842

Watervliet, NY • 2.4 mi away
Thu Sep 3 • After 3 PM
3 bed • 2 bath • 1,450 sq ft
Standard clean • 1 dog

Interested?

Submit your price + availability:
[secure job link]

Or reply with your price and availability.
Example: "150, I can be there around 4 PM"
```

The message should stay concise while including the most decision-relevant information.

---

# 7. Recommended SMS Information Hierarchy

Every provider SMS should include:

1. Well Kept branding
2. Job reference
3. Approximate location
4. Distance
5. Requested date/time
6. Bedrooms / bathrooms
7. Square footage
8. Cleaning type
9. Important job-specific note such as pets
10. Link to submit an offer
11. Ability to reply directly by text

Avoid sending the homeowner's exact contact information before an offer is accepted.

---

# 8. Provider Response Form

The preferred method for collecting provider responses should be a **small mobile web form**.

The form should:

- Require no account
- Require no app
- Require no password
- Require no OTP
- Be tied directly to the provider and job
- Load quickly on mobile
- Take roughly 10–20 seconds to complete

The unique link identifies:

```text
Job ID
Provider ID
Secure response token
```

Example conceptual URL:

```text
wellkept.com/j/WK1842/x7h92
```

The token should be random, secure, difficult to guess, and expire or become invalid when appropriate.

---

# 9. Provider Form Layout

## Header

```text
Well Kept

Cleaning Job #WK-1842
Watervliet, NY • 2.4 miles away

Thu Sep 3 • After 3 PM
3 bed • 2 bath • 1,450 sq ft
Standard clean • 1 dog
```

## Offer Section

### Can you take this job?

```text
Yes
No
```

If **No**, optionally ask:

```text
When is your earliest availability?
```

This can help Well Kept surface useful alternatives to the homeowner.

---

## Offer Type

```text
Fixed Price
Estimate
Free In-Person Quote
Hourly
Need More Details
```

---

## Price

For fixed price:

```text
$ [ 150 ]
```

For hourly:

```text
$ [ 65 ] / hour
```

The price field can be optional for:

- Free quote
- Need more details

---

## Availability

First ask:

```text
Can you meet the homeowner's requested schedule?

Yes
No
```

If yes:

```text
Arrival Time
[ 4:00 PM ]
```

If no:

```text
Earliest Available Date
[ Sep 4 ]

Earliest Available Time
[ 9:00 AM ]
```

---

## Provider Notes

Optional field:

```text
Anything the homeowner should know?

[ Price assumes standard cleaning condition. ]
```

---

## Submission

Large primary button:

```text
Submit Offer
```

After submission:

```text
Offer Submitted

Job #WK-1842
$150
Thursday around 4:00 PM

We'll let you know if the homeowner selects you.
```

---

# 10. Structured Offer Model

Every response should ultimately be stored in a normalized structure.

Example:

```json
{
  "job_id": "WK-1842",
  "provider_id": "provider_483",
  "interested": true,
  "offer_type": "fixed_price",
  "price": 150,
  "hourly_rate": null,
  "requested_schedule_accepted": true,
  "available_date": "2026-09-03",
  "arrival_time": "16:00",
  "notes": "Price assumes standard cleaning condition.",
  "source": "provider_form",
  "status": "submitted"
}
```

Recommended offer types:

```text
fixed_price
estimate
free_quote
hourly
needs_details
```

Recommended statuses:

```text
sent
viewed
started
submitted
declined
expired
accepted
not_selected
withdrawn
```

---

# 11. Natural-Language SMS Fallback

The form should be the preferred method, but providers should also be allowed to simply reply to the Twilio SMS.

Example:

```text
150, I can be there around 4
```

or:

```text
Yeah probably around 4:30. I'd do 150 assuming it's a normal clean.
```

Well Kept should use NLP to extract:

```text
Interested: Yes
Price: $150
Availability: Thursday around 4:30 PM
Offer Type: Conditional Fixed Price
Condition: Assumes standard cleaning
```

---

# 12. SMS Confirmation Step

Do not immediately treat an ambiguous NLP result as a final bid.

Send the cleaner a confirmation.

Example:

```text
Got it.

Job #WK-1842
Price: $150
Arrival: Thu around 4:30 PM
Note: Assumes standard cleaning

Reply YES to submit.

Or edit here:
[secure link]
```

Cleaner:

```text
YES
```

Then store the normalized offer.

This substantially reduces errors while preserving the convenience of natural-language texting.

---

# 13. Handling Ambiguous Responses

Examples:

### Provider says:

```text
Probably 150-175 depending on how bad it is.
```

Do not automatically convert this to a firm $150 bid.

Normalize it as:

```text
Offer Type: Estimate
Estimated Range: $150-$175
Requires Additional Details: Yes
```

Or send:

```text
Would you like us to submit this as an estimated price of $150-$175?

Reply YES or edit here:
[link]
```

---

# 14. "Need More Details" Flow

Providers should have a simple way to indicate:

```text
Need More Details
```

They can submit a question such as:

```text
Are the floors mostly hardwood or carpet?
```

The homeowner sees the question inside Well Kept.

The homeowner can answer without the provider receiving their direct contact information yet.

This lets Well Kept continue acting as the intermediary before an introduction occurs.

---

# 15. Homeowner Offer Experience

Every submitted provider response becomes a structured offer card in the homeowner app.

Example:

```text
Maria's Cleaning
4.9 ★ • 184 reviews

$150
Fixed Price

Available
Thu Sep 3 • 4:00 PM

"Price assumes standard cleaning condition."

[ Accept Offer ]
```

Another:

```text
Albany Sparkle
4.8 ★ • 96 reviews

$135
Fixed Price

Earliest Availability
Fri Sep 4 • 9:00 AM

[ Accept Offer ]
```

Another:

```text
Capital Region Cleaning
4.9 ★ • 221 reviews

Free Estimate

Available
Thu Sep 3 • 5:30 PM

[ Request Estimate ]
```

The homeowner experience should make it very easy to compare:

- Rating
- Reviews
- Price
- Offer type
- Requested schedule match
- Earliest availability
- Provider note

---

# 16. Provider Status in the Homeowner App

The homeowner should also see that Well Kept is actively working on their request.

Example:

```text
Finding cleaners...

18 nearby cleaners contacted
5 responded
3 offers received
```

Possible job outreach statuses:

```text
Finding Providers
Contacting Providers
Collecting Responses
Offers Available
Provider Selected
Connected
Closed
```

This makes the service feel active even while responses are still arriving.

---

# 17. When to Stop Outreach

Do not necessarily contact every provider at once.

The MVP can use staged outreach.

Example:

```text
Stage 1:
Contact top 5 providers

Wait for responses

Stage 2:
If fewer than 3 quality offers, contact next 5

Stage 3:
Continue until:
- enough offers are received
- provider pool is exhausted
- homeowner accepts an offer
- outreach window expires
```

This avoids unnecessary provider messaging and helps preserve provider engagement.

A reasonable initial target might be:

```text
3-5 useful offers per homeowner job
```

The exact number should be adjusted based on real conversion data.

---

# 18. Offer Acceptance Flow

When the homeowner accepts an offer:

```text
Homeowner selects provider
        ↓
Offer marked ACCEPTED
        ↓
Other providers marked NOT SELECTED
        ↓
Well Kept creates introduction
        ↓
Contact information is revealed
        ↓
Both parties receive job reference
```

---

# 19. Shared Job Reference

Every job should have a short human-readable reference.

Example:

```text
WK-1842
```

This reference should appear:

- In every provider SMS
- In the provider form
- In the homeowner app
- In acceptance notifications
- In provider notifications
- In message threads
- In future support requests

This is especially useful if the homeowner and provider continue the conversation by phone.

Example:

```text
"Hi, I'm calling about Well Kept job WK-1842."
```

Both parties immediately know which job is being discussed.

---

# 20. Introduction Notification

## Cleaner

```text
You're connected!

Well Kept job #WK-1842

The homeowner accepted your $150 offer.

Jai
(518) 555-0197

Thu Sep 3 • Around 4:00 PM

You can contact the homeowner directly to finalize the details.
```

## Homeowner

```text
You're connected!

Well Kept job #WK-1842

Maria's Cleaning
(518) 555-0143

Accepted Offer:
$150
Thu Sep 3 • Around 4:00 PM

You can contact Maria directly to finalize the details.
```

---

# 21. Messaging After Connection

The Well Kept Messages tab should open a thread for the accepted job.

However, using the Well Kept messaging interface should remain optional.

The homeowner and cleaner can communicate through:

- Well Kept
- SMS
- Phone
- Email

The job reference remains the common identifier across all channels.

Well Kept should not unnecessarily force communication to remain inside the app.

---

# 22. Provider Authentication

For the MVP, providers should not need an account to respond to an individual job.

Use a secure job-specific link containing:

```text
Provider ID
Job ID
Signed / random token
```

The backend should validate the token before allowing the offer to be submitted.

Important security considerations:

- Long random tokens
- HTTPS only
- Expiration rules
- Prevent token reuse where inappropriate
- Rate limiting
- Audit submission time
- Audit originating phone/provider
- Never expose homeowner personal information before acceptance

---

# 23. Twilio Components

Recommended Twilio usage:

## Twilio Messaging

Use for:

- New lead notifications
- Provider reminders
- NLP bid confirmation
- Offer acceptance
- Introduction messages
- Optional homeowner notifications

## Incoming SMS Webhook

Twilio forwards provider SMS replies to the Well Kept backend.

Example flow:

```text
Provider sends SMS
        ↓
Twilio receives message
        ↓
Twilio webhook → Well Kept backend
        ↓
Match conversation to Job + Provider
        ↓
NLP parser extracts response
        ↓
Confirmation SMS
        ↓
Provider confirms
        ↓
Offer stored
```

---

# 24. Suggested Backend Objects

## Job

```text
id
reference_number
homeowner_id
service_type
address
latitude
longitude
requested_date
requested_start_time
requested_end_time
bedrooms
bathrooms
sq_ft
pets
notes
status
created_at
```

## Provider

```text
id
business_name
google_business_id
phone
email
website
rating
review_count
latitude
longitude
service_area
profile_status
preferred_contact_channel
created_at
```

## JobProviderOutreach

Represents one provider being contacted about one job.

```text
id
job_id
provider_id
status
channel
sms_message_sid
sent_at
viewed_at
responded_at
response_token
last_reminder_at
```

## Offer

```text
id
job_id
provider_id
outreach_id
offer_type
price
price_min
price_max
hourly_rate
requested_schedule_accepted
available_date
arrival_time
notes
source
status
submitted_at
accepted_at
```

## Introduction

```text
id
job_id
provider_id
homeowner_id
offer_id
created_at
```

---

# 25. Suggested API Endpoints

Example MVP API:

```text
POST /jobs
POST /jobs/{job_id}/match-providers
POST /jobs/{job_id}/start-outreach

GET /provider-response/{token}
POST /provider-response/{token}

POST /webhooks/twilio/incoming
POST /webhooks/twilio/status

GET /jobs/{job_id}/offers
POST /jobs/{job_id}/offers/{offer_id}/accept

GET /jobs/{job_id}/introduction
```

---

# 26. Provider Reminder Logic

If a provider has not responded:

```text
Initial SMS
    ↓
Optional reminder after appropriate delay
    ↓
No further outreach for that job
```

Example reminder:

```text
Reminder: Well Kept job #WK-1842 is still looking for a cleaner.

Thu Sep 3 • After 3 PM
3 bed • 2 bath • 2.4 mi away

Submit an offer:
[link]
```

Avoid excessive follow-ups.

Track provider responsiveness so future outreach can prioritize businesses that actually engage.

---

# 27. Opt-Out Handling

Every outreach system must properly support provider opt-outs.

At minimum, honor messages such as:

```text
STOP
UNSUBSCRIBE
CANCEL
END
QUIT
```

Store the provider's messaging preference so Well Kept does not continue sending unwanted leads.

The system should also support a less permanent option such as:

```text
PASS
```

Meaning:

```text
Not interested in this specific job.
```

This is different from opting out of Well Kept messages entirely.

---

# 28. MVP Provider Responses

The MVP only needs to understand a small response vocabulary.

Examples:

```text
YES
NO
PASS
STOP
CALL
QUOTE
```

And natural responses such as:

```text
150 Thursday 4
```

```text
I can do it Friday morning for 140
```

```text
Need to see it first but I can give a free estimate Thursday
```

```text
Not available until Saturday
```

These should normalize into structured offer data.

---

# 29. Provider Form vs SMS

The operating principle should be:

## Structured form = preferred

Benefits:

- Cleaner data
- Fewer interpretation errors
- Easy homeowner comparison
- Fast validation
- Consistent fields
- Easier analytics

## SMS reply = supported fallback

Benefits:

- Lowest friction
- Familiar workflow
- Works for non-technical providers
- Allows quick participation

Use NLP to turn SMS into the same underlying `Offer` object produced by the form.

The homeowner should never care how the offer was submitted.

---

# 30. Future Provider Account Path

Providers should be able to participate indefinitely without an account.

Later, Well Kept can invite engaged providers to claim their profile.

Example:

```text
You've won 4 Well Kept jobs.

Claim your free profile to:
- Manage incoming jobs
- Save availability
- Set service areas
- Track leads
- Respond faster
```

Potential future provider states:

```text
External Provider
Verified Provider
Claimed Well Kept Provider
Preferred Provider
Subscriber
```

This should not block the MVP.

---

# 31. Future Provider Subscription

If Well Kept eventually introduces a provider subscription, it could offer:

- Priority job access
- Automated availability
- Saved pricing rules
- Custom service areas
- Job history
- CRM
- Messaging dashboard
- Analytics
- Faster lead alerts
- Auto-bid preferences
- Team accounts

The initial provider interaction should remain lightweight so Well Kept can build supply without requiring provider-side product adoption.

---

# 32. Marketplace Monetization

For the MVP, Well Kept can initially avoid charging providers while validating:

- Response rates
- Acceptance rates
- Lead quality
- Winning bid values
- Homeowner conversion

Later:

> Receive and bid on jobs for free.  
> You only pay when a homeowner chooses you and Well Kept connects you.

Potential models:

```text
Flat successful-introduction fee
Percentage of accepted bid
Provider subscription
Credits
Hybrid subscription + reduced introduction fee
```

Charging should occur only when the value is clear to the provider.

---

# 33. Metrics to Track From Day One

## Homeowner

- Jobs posted
- Time to first provider response
- Time to first offer
- Offers received per job
- Percentage of jobs with ≥1 offer
- Percentage of jobs with ≥3 offers
- Offer acceptance rate
- Time from job post to accepted provider

## Provider

- Providers contacted per job
- SMS delivery rate
- Link click rate
- Response rate
- Form completion rate
- SMS response rate
- Average response time
- Offer submission rate
- Offer acceptance rate
- Provider opt-out rate

## Marketplace

- Contacted providers → responses
- Responses → offers
- Offers → accepted offers
- Posted jobs → successful introductions
- Average accepted bid
- Average number of providers required to produce one accepted offer

---

# 34. Provider Intelligence Over Time

Initially Well Kept ranks businesses mostly using public data.

Over time, Well Kept should build its own provider performance dataset.

Example:

```text
Maria's Cleaning

Google:
4.9 stars
184 reviews

Well Kept:
81% response rate
Median response time: 6 minutes
31% offer acceptance rate
Typical price: $140-$170
Weekend availability: High
Average lead distance accepted: 4.2 miles
28 successful introductions
```

Eventually this allows Well Kept to rank providers based on:

> Who is most likely to be a strong fit and actually accept this specific job.

This becomes more useful than simply sorting providers by Google rating.

---

# 35. MVP Build Scope

## Phase 1

Build only the pieces necessary to validate the marketplace workflow.

### Homeowner

- Post cleaning job
- Job reference creation
- View outreach progress
- View structured provider offers
- Accept offer
- View provider contact information
- Message thread created after acceptance

### Provider Discovery

- Local provider database
- Provider ranking
- Select nearby providers for outreach

### Twilio

- Outbound SMS
- Incoming SMS webhook
- Delivery status tracking
- STOP / opt-out support
- Offer confirmation messaging
- Acceptance / introduction messaging

### Provider Form

- Secure no-login response link
- Job summary
- Interested / not interested
- Offer type
- Price
- Schedule confirmation
- Alternative availability
- Optional notes
- Submit

### NLP

- Parse straightforward provider SMS responses
- Extract price
- Extract availability
- Extract offer type where possible
- Detect ambiguity
- Send confirmation before submission

### Offer System

- Normalize form and SMS responses into the same Offer model
- Surface offers to homeowner
- Track status
- Accept one offer
- Mark remaining offers not selected

### Introduction

- Reveal contact information after acceptance
- Notify both parties
- Include shared Well Kept job reference
- Create Well Kept message thread

---

# 36. Explicitly Out of Scope for Initial MVP

Do not overbuild these yet:

- Provider mobile app
- Mandatory provider accounts
- Provider subscriptions
- Complex CRM
- Provider calendars
- Automated scheduling integrations
- Payment processing
- In-app job payments
- Escrow
- Advanced AI voice calling
- Complex AI matching
- Dynamic pricing algorithms
- Full provider dashboard
- Provider team management
- Automated quoting models

These can be added after validating the core marketplace loop.

---

# 37. MVP Success Definition

The MVP works if this can happen reliably:

```text
1. Homeowner posts one cleaning request.

2. Well Kept automatically identifies nearby, highly rated cleaners.

3. Twilio sends those cleaners a concise job summary.

4. Cleaners can submit an offer in under 20 seconds without creating an account.

5. Well Kept turns every response into structured:
   - price
   - availability
   - quote type
   - notes

6. Homeowner sees multiple comparable offers in the Well Kept app.

7. Homeowner accepts one.

8. Both parties receive:
   - each other's contact information
   - accepted offer details
   - Well Kept job reference

9. They communicate however they prefer from that point forward.
```

That is the core Well Kept marketplace loop.

---

# 38. Product Positioning

## Homeowner

**Post your job once.**

Well Kept reaches out to highly rated local cleaners, gathers their pricing and availability, and organizes the responses for you.

Choose the one you want.

---

## Provider

**Receive local jobs for free.**

Review the job, submit your price and availability, and only get connected when the homeowner chooses you.

No app required.

---

# 39. Core Product Philosophy

Well Kept should optimize for the homeowner experience.

The provider-side technology exists primarily to make supply accessible with as little friction as possible.

The MVP therefore should not attempt to convince every cleaning business to become a Well Kept software user.

Instead:

> Well Kept should make the existing local cleaner market behave like an organized, responsive marketplace for the homeowner.
