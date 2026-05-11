# Well Kept Design System Plan

Well Kept is a mobile-first home cleaning marketplace. Homeowners post jobs, cleaners bid, and homeowners compare offers before accepting one.

The interface must be simple enough for non-technical users with low reading tolerance. Screens should use short labels, obvious next actions, large touch targets, plain language, and repeated familiar patterns.

This document is a planning spec. Do not treat it as implemented code.

## Design Principles

- Mobile first: design every flow for 320px-430px screens before desktop.
- One clear action per screen: primary action should be obvious without reading the full page.
- Plain language: use short words and direct verbs, for example "Post job", "Send bid", "Accept bid", "Call cleaner".
- Trust before payment: show job status, vetting, payment hold, ratings, and cleaner identity near commitment actions.
- Cards are action boundaries: use cards for jobs, bids, cleaners, payment notices, and form groups. Do not wrap every page section in a card.
- Keep controls familiar: use shadcn/Radix primitives for forms, drawers, dialogs, popovers, navigation, and state.

## 1. Color Token Usage

Use semantic tokens first, not raw color names. Recommended implementation can map these to shadcn CSS variables.

| Token | Usage |
|---|---|
| `background` | App background. Warm ivory, never pure white. |
| `foreground` | Main text. Warm charcoal with a slight green/brown tint. |
| `card` | Primary card surface. Soft warm white. |
| `card-foreground` | Text inside cards. |
| `muted` | Subtle panels, disabled surfaces, section backgrounds. |
| `muted-foreground` | Helper text, timestamps, metadata. |
| `border` | Default low-contrast sage/stone border. |
| `input` | Input border and neutral control border. |
| `primary` | Deep residential green for main actions. |
| `primary-foreground` | Warm ivory text on primary green. |
| `secondary` | Warm neutral surface for secondary actions. |
| `secondary-foreground` | Green-charcoal text on secondary actions. |
| `accent` | Light green selected state background. |
| `accent-foreground` | Deep green selected state text. |
| `destructive` | Muted red for delete/cancel-danger actions. |
| `warning` | Amber for needs attention, pending payment, expiring windows. |
| `success` | Green for accepted, paid, available, complete. |

Rules:

- Primary green is for actions that move the marketplace forward: post, continue, send bid, accept bid, save.
- Use amber only when the user must pay attention but does not need to panic.
- Use red only for destructive actions or failed states.
- Selected cards use light green background plus a green border, not heavy fills.
- Avoid purple, navy dashboard tones, pure black, and pure white.
- Never rely on color alone. Pair status color with text and, where useful, an icon.

## 2. Typography Scale

Use a native sans stack for product UI. Use a classic serif only for brand and major screen titles.

| Token | Size | Usage |
|---|---:|---|
| `text-xs` | 12px | Status details, counts, timestamps. |
| `text-sm` | 14px | Helper text, metadata, secondary labels. |
| `text-base` | 16px | Body text, inputs, buttons. |
| `text-lg` | 18px | Card titles and important list item names. |
| `text-xl` | 20px | Section headings. |
| `text-2xl` | 24px | Detail page titles on mobile. |
| `text-3xl` | 30px | Dashboard/page titles. |
| `display-sm` | 36px | Major brand/app home titles. |

Rules:

- Body text should be 16px minimum.
- Buttons and inputs should use 16px to avoid mobile zoom.
- Bid prices use tabular numerals and a larger scale than surrounding text.
- Keep most headings under two lines on 320px screens.
- Labels should be short: "Price", "Arrival", "Notes", "Pets", "ZIP".

## 3. Spacing Rules

Use a 4px spacing base with predictable mobile rhythm.

| Token | Size | Usage |
|---|---:|---|
| `space-1` | 4px | Tight icon/text gaps. |
| `space-2` | 8px | Small field hints, badge gaps. |
| `space-3` | 12px | Control padding, compact stacks. |
| `space-4` | 16px | Default card padding on mobile. |
| `space-5` | 20px | Section gap, larger card padding. |
| `space-6` | 24px | Page group gap. |
| `space-8` | 32px | Major section gap. |

Rules:

- Mobile page padding: 16px left/right.
- Detail screens: 16px page padding, 20px vertical section gaps.
- Card padding: 16px mobile, 20px tablet/desktop.
- Form field gap: 12px between fields, 20px between form groups.
- Sticky bottom action must reserve safe-area space and not overlap bottom nav.

## 4. Border Radius Rules

Keep shapes friendly but not bubbly.

| Token | Size | Usage |
|---|---:|---|
| `radius-xs` | 6px | Small badges, tags. |
| `radius-sm` | 8px | Inputs, compact controls. |
| `radius-md` | 12px | Buttons, select triggers, segmented controls. |
| `radius-lg` | 16px | Cards, empty states, banners. |
| `radius-xl` | 20px | Bottom nav, sticky action bars, drawers. |
| `radius-full` | 999px | Pills, avatars, round icon buttons. |

Rules:

- Cards default to 16px.
- Buttons default to 12px.
- Status badges are pills.
- Avoid nested cards with the same radius. Use separators inside cards instead.

## 5. Button Variants

Build on shadcn `Button`.

| Variant | Usage |
|---|---|
| `primary` | Main action: post job, continue, send bid, accept bid, save. |
| `secondary` | Back, manage, view, non-primary navigation. |
| `outline` | Low-risk secondary action inside cards. |
| `ghost` | Header links, inline edit, icon-only actions. |
| `destructive` | Delete job, delete preset, cancel committed request. |
| `stickyPrimary` | Full-width bottom action on mobile. |
| `icon` | Back, filter, close, edit, nav icon buttons. |
| `pulsatingPrimary` | Notable continue/post/bid creation actions that need attention. |
| `rippleAction` | Bid buttons and general interactive clicks where immediate response matters. |

Rules:

- Minimum touch target: 44px, preferred 48px.
- Primary buttons should use sentence case: "Post job", not "POST JOB".
- One primary button per visible action area.
- Destructive actions require confirmation unless they are reversible.
- Use loading text that says what is happening: "Posting...", "Sending...", "Saving...".
- Use pulsating buttons sparingly. One visible pulsating button maximum per screen.
- Ripple feedback is allowed on bid buttons, card-click actions, and other high-frequency taps.
- Respect reduced motion: pulsating and ripple variants must fall back to standard button feedback.

### Magic UI Button References

Use Magic UI as the implementation reference during the build phase:

- Pulsating Button: https://magicui.design/docs/components/pulsating-button
- Ripple Button: https://magicui.design/docs/components/ripple-button

#### PulsatingPrimary

Use for notable forward-progress actions:

- Customer home primary create/post action.
- Job request wizard "Continue" when it is the main next step.
- Final "Post job for bids" action.
- Cleaner bid task "Send bid" or "Create bid".

Do not use for:

- Secondary links.
- Destructive actions.
- Every button in a form.
- Dense lists where several buttons are visible at once.

#### RippleAction

Use for immediate tap feedback:

- Cleaner nearby jobs "Bid" button in `NearbyJobSwipeCarousel`.
- Clickable job cards when tapping opens details.
- Clickable bid cards when tapping opens comparison/detail.
- General card/list actions where the user needs instant response that the tap registered.

Do not use for:

- Disabled/loading buttons.
- Confirmation dialog destructive buttons.
- Background-only decorative interactions.

## 6. Card Variants

Build on shadcn `Card`, but expose app-level variants.

| Variant | Usage |
|---|---|
| `default` | General grouped content. |
| `interactive` | Clickable job, bid, cleaner, or message cards. |
| `selected` | Chosen bid, selected option, active preset. |
| `summary` | Job detail facts, account summary, checkout summary. |
| `alert` | Payment hold, trust warnings, important next steps. |
| `empty` | Empty states with one next action. |
| `compact` | Dense rows, conversation previews, small dashboards. |

Rules:

- Interactive cards need a visible hover/focus state and full-card focus ring.
- Do not apply hover to non-clickable cards.
- Important cards show the most useful fact first: price, status, time, or location.
- Use separators for detail rows instead of nested cards.

## 6.1 Motion Card Patterns

Use Skiper UI as interaction inspiration, but rebuild the visual layer in the Well Kept theme. Do not copy the default demo styling.

References:

- Card stack scroll: https://skiper-ui.com/v1/skiper16
- Card swipe carousel: https://skiper-ui.com/v1/skiper48

### JobStackScroll

Inspired by Skiper `skiper16`. The reference uses scroll-linked stacked cards with scale/transform animation and lists `framer-motion` plus `lenis` as dependencies.

Well Kept usage:

- Homeowner home: "Open jobs for bids".
- Cleaner home: "Up next jobs".

Rules:

- Cards must remain readable at all stacked positions.
- The top card always shows the next most important job.
- Provide a reduced-motion fallback as a simple vertical list.
- Do not use this for long browsing lists. Use it for 2-5 important cards.
- Keep actions obvious: "Review bids", "View job", "Message", or "Start".

### NearbyJobSwipeCarousel

Inspired by Skiper `skiper48`. The reference is a touch-friendly swipeable card stack and lists `swiper` plus `framer-motion` as dependencies.

Well Kept usage:

- Cleaner home: "Nearby jobs".

Rules:

- Each card represents one nearby job and has one primary action: "Bid".
- Swipe should browse jobs, not commit to bidding.
- Include non-swipe controls for accessibility: previous, next, and visible pagination.
- Provide a reduced-motion fallback as a vertical list or simple carousel.
- Avoid autoplay for job discovery. Nearby jobs should not move while someone is reading.

## 7. Form Patterns

Use shadcn `Form`, `Input`, `Textarea`, `Select`, `RadioGroup`, `Checkbox`, `ToggleGroup`, `Popover`, `Calendar`, and `Command`.

Rules:

- Every field has a visible label.
- Helper text is short and below the label or field.
- Errors appear under the field and in a top-level `Alert` for form-wide errors.
- Use grouped card sections for long forms: Location, Timing, Access, Notes.
- Use `RadioGroup` or `ToggleGroup` for choices with 2-5 options.
- Use `Select` for long option sets.
- Use `Popover + Calendar` for dates when exact date picking matters.
- Use `PriceInput` for money. Always show `$`.
- Use `useFormStatus` for pending submit states.
- Prefer multi-step mobile forms when a single screen would require more than 6 fields.

Low-reading-level rules:

- Field labels should be 1-3 words.
- Helper text should be one sentence.
- Avoid paragraphs in forms.
- Use examples in placeholders only when helpful: "Door code or key spot".

## 8. Modal and Drawer Patterns

Use drawers for mobile task panels and dialogs for confirmation.

| Pattern | Component | Usage |
|---|---|---|
| Confirmation | `AlertDialog` | Accept bid, delete job, delete home preset, cancel job. |
| Mobile task panel | `Drawer` or `Sheet` | Filter jobs, edit home preset, view bid details. |
| Small picker | `Popover` | Preset picker, date picker, command search. |
| Full dialog | `Dialog` | Rare desktop-only tasks or account management overlays. |

Rules:

- Do not use modals for normal forward progress.
- Mobile drawers should have one primary action at the bottom.
- Confirmation copy must say what happens next.
- Destructive dialog buttons use destructive styling and plain labels: "Delete job".

## 8.1 Toast and Popup Patterns

Use shadcn Sonner for lightweight success feedback.

Reference:

- Sonner: https://ui.shadcn.com/docs/components/radix/sonner

Planned setup:

- Add shadcn `sonner`.
- Mount `Toaster` once in the root layout or app shell.
- Use `toast.success()` for completed marketplace actions.

Required success messages:

| Event | Toast title | Optional description |
|---|---|---|
| Customer posts a job for bids | `Job posted` | `Cleaners can now send bids.` |
| Cleaner sends a bid | `Bid sent` | `The homeowner can now review it.` |

Rules:

- Toasts confirm successful completion only. Do not use them as the only error surface.
- Keep toast titles 2-4 words.
- Use sentence case in UI: `Job posted`, `Bid sent`.
- Toasts should not block the next action.
- On server-action redirects, trigger toast from a query flag or client-side success bridge, then clear/replace the URL state.

## 9. Empty State Patterns

Create one reusable `EmptyState`.

Structure:

1. Short title, 3-6 words.
2. One sentence explaining why the screen is empty.
3. One primary action if there is a useful next step.
4. Optional small icon.

Examples:

- Title: "No jobs yet"
- Body: "Post a job and cleaners can send bids."
- Action: "Post job"

Rules:

- Empty states should never blame the user.
- Avoid long education copy.
- For cleaner empty jobs, explain that new matching jobs will appear here and link to availability/settings if relevant.

## 10. Status Badge System

Create `JobStatusBadge` on top of shadcn `Badge`.

| Status | Tone | Label |
|---|---|---|
| Draft | neutral | Draft |
| Open | active/success | Open |
| Bids received | active | Bids in |
| Awarded | success | Accepted |
| Payment held | warning | Payment held |
| Scheduled | active | Scheduled |
| In progress | active | In progress |
| Completed | success | Done |
| Cancelled | destructive | Cancelled |
| Expired | warning | Expired |

Rules:

- Labels should be short.
- Use the same label everywhere.
- Badge text should not require marketplace knowledge.
- When status affects money or work, add a nearby explanatory line.

## 11. Mobile Navigation Rules

Create `BottomNav`.

Rules:

- Bottom nav is the primary in-app navigation on mobile.
- Use 3-4 items maximum.
- Each item has an icon and a one-word label.
- Minimum item height: 56px.
- Respect `env(safe-area-inset-bottom)`.
- Hide or simplify bottom nav on focused task screens if a sticky action is present.
- Do not include links to missing routes.
- Active nav state uses icon fill/tint plus label color, not only background.

Recommended nav:

- Customer: Home, Jobs, Messages, Account.
- Cleaner: Jobs, Bids, Messages, Account.

## 12. Page Layout Rules

Create shell components:

- `MarketingShell`
- `AuthShell`
- `AppShell`
- `TaskShell`
- `PageHeader`
- `StickyActionBar`
- `AccountDropdown`

Rules:

- Mobile app pages use max width 680px and centered content on tablet/desktop.
- Task screens like bid submission can use narrower max width, around 430px-520px.
- Page headers use a short title and optional one-line subtitle.
- Avoid global `main` constraints that force landing, auth, onboarding, and app screens into the same layout.
- Keep primary action visible near the bottom on mobile.
- Desktop should widen content, not create a different product.

## 13. Auth and Account Menu Patterns

Use the shadcn login blocks as visual inspiration while keeping Clerk as the authentication backend.

Reference:

- shadcn login blocks: https://ui.shadcn.com/blocks/login

### AuthShell

Use for login, signup, and account setup.

Rules:

- Use a modern centered shell on mobile with a max-width form card.
- On desktop, allow a two-column layout with brand/trust content or warm home-cleaning imagery.
- Keep Clerk forms, but style Clerk appearance to match Well Kept tokens.
- Use short auth copy: "Sign in", "Create account", "Continue".
- Include role context for signup without making users read paragraphs.
- Avoid marketing-heavy hero sections inside auth.

Recommended shadcn block influence:

- `login-03` for muted background and centered card.
- `login-04` for form plus image on wider screens.
- `login-02` for simple brand area plus form.

### AccountDropdown

Use when clicking the account icon in the top-left/top app chrome for both homeowner and cleaner sides.

Build from:

- shadcn `DropdownMenu`
- shadcn `Avatar`
- shadcn `Button`
- Clerk user/session data

Menu structure:

- User identity row: name, email, avatar/initials.
- Role home link: "Home".
- Customer links: "Jobs", "Home presets", "Account".
- Cleaner links: "Jobs", "Bids", "Messages", "Account".
- Settings/profile action if supported by Clerk.
- Sign out.

Rules:

- The menu must be role-aware.
- Use one-word or short labels.
- Use separators between identity, navigation, and sign out.
- Sign out is visually quiet but clear.
- The dropdown should be reachable by keyboard and screen reader.

## App-Specific Components

### JobCard

Purpose: Shows a cleaning job in customer and cleaner lists.

Content:

- Job title.
- Location or service area.
- Timing summary.
- Room/home facts.
- Bid count.
- Status badge.
- Primary next action or link.

Variants:

- `customer`: shows bid count and accepted cleaner if any.
- `cleaner`: shows distance/service area, home facts, and "Bid".
- `compact`: dashboard rail or message context.

Rules:

- Entire card can be clickable if it only has one action.
- If the card has multiple actions, use separate buttons and avoid full-card link.

### BidCard

Purpose: Shows one cleaner bid.

Content:

- Cleaner name and avatar.
- Trust signals: rating, reviews, insured/vetted.
- Price.
- Arrival timing.
- Optional cleaner note.
- Bid status.

Variants:

- `comparison`: for homeowner bid review.
- `submitted`: for cleaner bid history.
- `accepted`: emphasized accepted bid.
- `compact`: small summaries.

Rules:

- Price must be visually dominant.
- Accepted/recommended state uses selected card styling.
- Accept action should use confirmation if money or job assignment changes.

### BidPanel

Purpose: A focused panel for bid comparison or bid submission.

Use cases:

- Homeowner compares bids.
- Cleaner submits/updates bid.

Patterns:

- Mobile drawer or task screen.
- Sticky bottom primary action.
- Clear payment/trust context near action.

### CleanerCard

Purpose: Shows cleaner identity and trust.

Content:

- Avatar/initials or logo.
- Name/business name.
- Rating/review count.
- Licensed/insured/vetted badges.
- Short headline.
- Service area or availability.

Rules:

- Trust badges should be visible before accepting a bid.
- Keep headline to one line where possible.

### PaymentHeldBanner

Purpose: Explains escrow/payment hold state in plain language.

Content:

- Status: "Payment held".
- Plain explanation: "Your payment is held until the job is done."
- Optional amount.
- Optional action: "View details".

Tone:

- Warning/amber if action is needed.
- Neutral/success if simply informational.

### JobStatusBadge

Purpose: Standard badge for job lifecycle.

Rules:

- Uses the status badge system above.
- Accepts only known app statuses.
- Provides consistent labels across customer and cleaner views.

### BottomNav

Purpose: Mobile role-based navigation.

Props:

- `role`: `customer` or `cleaner`.
- `items`: resolved route list.
- `activePath`.
- `hiddenOnTaskScreen` optional.

Rules:

- No missing routes.
- Accessible nav label.
- Icon plus text for every item.

### EmptyUpcomingJobs

Purpose: Empty state for cleaner upcoming/open jobs.

Copy:

- Title: "No jobs right now"
- Body: "New jobs that match your area will show here."
- Optional action: "Check availability"

Rules:

- Keep the state calm and not alarming.
- Show a skeleton while jobs are loading, not this empty state.

### PriceInput

Purpose: Money input for bids and cleaner defaults.

Features:

- `$` prefix.
- Numeric keyboard.
- Optional cents normalization.
- Error text.
- Helper text.

Rules:

- Use large readable digits on bid screens.
- Do not require users to type `$`.
- Accept whole dollars by default.

### JobTimeline

Purpose: Shows job lifecycle and next step.

Steps:

- Posted.
- Bids received.
- Bid accepted.
- Payment held.
- Scheduled.
- Done.

Rules:

- Current step is visually clear.
- Future steps are muted.
- Each step label should be short.

### MessageThreadPreview

Purpose: Shows one conversation in message lists.

Content:

- Customer/cleaner avatar.
- Name.
- Job title.
- Last message preview or status fallback.
- Time.
- Unread state.
- Job/bid status badge when useful.

Rules:

- One-line preview with truncation.
- Large tap target.
- Do not show empty threads unless a bid or accepted job created them.

### SuccessToast

Purpose: Standardized Sonner helper for marketplace success feedback.

Events:

- `job-posted`: title `Job posted`, description `Cleaners can now send bids.`
- `bid-sent`: title `Bid sent`, description `The homeowner can now review it.`

Rules:

- Trigger only after the server confirms success.
- Do not show duplicate toasts on back/forward navigation.
- Keep text plain and short.

### AuthShell

Purpose: Modern Clerk-backed auth layout inspired by shadcn login blocks.

Used by:

- Login.
- Signup.
- Welcome/account setup.

Rules:

- Clerk remains the auth backend.
- Visual shell, brand area, and role context are app-owned.
- Works as a single-column mobile screen and optional two-column desktop screen.

### AccountDropdown

Purpose: Role-aware account menu opened from the account icon.

Used by:

- Customer app.
- Cleaner app.

Rules:

- Built with `DropdownMenu`.
- Contains identity, role navigation, account/settings, and sign out.
- Replaces inconsistent account link/user button behavior.

## Implementation Notes for shadcn Phase

- Add shadcn primitives first, then wrap them with app-specific components.
- Keep `components/ui` for unmodified or lightly themed shadcn components.
- Put marketplace-specific components in `components/marketplace` or `components/app`.
- Replace global selectors like `button[type="submit"]` with explicit `Button` usage.
- Add loading skeletons as part of each redesigned route, not after.
- Use `UI_MIGRATION_MATRIX.md` as the working map from current routes/components to planned design-system components.
