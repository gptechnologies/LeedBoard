# Well Kept UI Migration Matrix

This matrix maps the current UI to the planned design-system components. It incorporates the Skiper UI interaction references the team wants to adapt:

- Skiper card stack scroll: https://skiper-ui.com/v1/skiper16
- Skiper card swipe carousel: https://skiper-ui.com/v1/skiper48
- Magic UI pulsating button: https://magicui.design/docs/components/pulsating-button
- Magic UI ripple button: https://magicui.design/docs/components/ripple-button
- shadcn Sonner: https://ui.shadcn.com/docs/components/radix/sonner
- shadcn login blocks: https://ui.shadcn.com/blocks/login

Important: Skiper is an interaction reference. The Well Kept implementation should use our warm ivory, deep green, plain-language, mobile-first design system.

## Skiper-Inspired Component Targets

| Planned component | Inspired by | Current mapping | Future usage | Notes |
|---|---|---|---|---|
| `JobStackScroll` | Skiper `skiper16` card stack scroll | `JobRequestCard` in `app/customer/page.tsx`; CSS-only `.cleaner-upnext-*` scaffolding in `app/globals.css` | Homeowner "Open jobs for bids"; cleaner "Up next jobs" | Use for 2-5 priority jobs. Reduced-motion fallback is a plain list. |
| `NearbyJobSwipeCarousel` | Skiper `skiper48` card swipe carousel | `CleanerJobsFeed` in `components/marketplace/cleaner-jobs-feed.tsx` | Cleaner nearby jobs list on home screen | Swipe browses nearby jobs only. "Bid" remains an explicit button. No autoplay. |

## Magic UI Button Targets

| Planned component/variant | Inspired by | Current mapping | Future usage | Notes |
|---|---|---|---|---|
| `PulsatingPrimaryButton` or `Button variant="pulsatingPrimary"` | Magic UI Pulsating Button | `button`, `.button`, `.button-link`, `button[type="submit"]` on main actions | Notable continue buttons, final "Post job for bids", customer home create/post action, cleaner create/send bid action | One visible pulsating button maximum per screen. Reduced-motion fallback required. |
| `RippleActionButton` or `Button variant="rippleAction"` | Magic UI Ripple Button | `cleaner-action-button`, clickable job/bid cards, general card/list taps | Cleaner nearby job "Bid" buttons, card-click feedback, high-frequency action taps | Use to confirm tap registration immediately. Do not use on destructive confirmation buttons. |

## shadcn Feedback and Auth Targets

| Planned component/pattern | Inspired by | Current mapping | Future usage | Notes |
|---|---|---|---|---|
| `SuccessToast` with Sonner | shadcn Sonner | Query-string error notices exist, no success feedback found | Show `Job posted` after customer posts a job; show `Bid sent` after cleaner sends a bid | Mount `Toaster` once. Trigger only after confirmed success. |
| `AuthShell` | shadcn login blocks | `auth-shell` in login/signup/welcome pages with Clerk widgets | Modern login, signup, and account setup screens with Clerk backend | Use login block layout ideas, not default generic Clerk presentation. |
| `AccountDropdown` | shadcn `DropdownMenu`/login block account polish | `AccountUserButton`, customer `Account` link, cleaner Clerk user button | Account icon dropdown in top-left/top app chrome for both customer and cleaner | Role-aware links, identity row, sign out, keyboard accessible. |

## Primary Surface Migration

| Current route/component | Current role/surface | Current UI pattern | Planned design-system target | shadcn base | Priority | Notes |
|---|---|---|---|---|---|---|
| `app/customer/page.tsx` open jobs section | Customer home | Horizontal rail of `JobRequestCard` | `JobStackScroll` using `JobCard`; main create/post action uses `PulsatingPrimaryButton` | `Card`, `Button`, `Badge` | High | This is the homeowner "Open jobs for bids" mapping. |
| `app/cleaner/page.tsx` | Cleaner home | `CleanerJobsFeed` only, no active Up Next component | `CleanerHome` with `JobStackScroll` for up next and `NearbyJobSwipeCarousel` for nearby jobs | `Card`, `Button`, `Badge`, `Skeleton` | High | Up Next needs a real data-backed component. Current `.cleaner-upnext-*` CSS suggests intent but no active JSX. |
| `components/marketplace/cleaner-jobs-feed.tsx` | Cleaner nearby jobs | Vertical card list with pull-to-refresh and inert filter button | `NearbyJobSwipeCarousel` plus `NearbyJobCard`; "Bid" uses `RippleActionButton` | `Card`, `Button`, `Badge`, `Sheet`, `Skeleton` | High | This is the cleaner nearby jobs carousel mapping. |
| `app/customer/jobs/page.tsx` | Customer jobs list | Vertical `JobRequestCard` list | `JobList` with `JobCard` rows and filters | `Tabs`, `Select`, `Card`, `Badge` | High | Keep list pattern for full archive. Do not use stack scroll for long lists. |
| `app/customer/jobs/[id]/page.tsx` | Customer job detail | Summary card, accepted bid, sticky action | `JobDetailPage`, `JobTimeline`, `BidPanel`, `StickyActionBar` | `Card`, `Separator`, `Button`, `Badge`, `AlertDialog` | High | Add confirmation for delete/review commitment actions. |
| `app/customer/jobs/[id]/bids/page.tsx` | Customer bid comparison | Top 3 bid cards with accept forms | `BidPanel` with `BidCard` comparison state | `Card`, `Button`, `Badge`, `AlertDialog`, `RadioGroup` | High | Accept bid requires clear payment/trust confirmation. |
| `app/cleaner/jobs/[id]/page.tsx` | Cleaner bid task screen | Job brief plus `BidForm` | `BidTaskShell`, `BidPanel`, `PriceInput`, `JobTimeline`, final submit uses `PulsatingPrimaryButton` | `Card`, `Form`, `Input`, `Textarea`, `ToggleGroup` | High | Keep focused narrow mobile layout. |
| `app/cleaner/bids/page.tsx` | Cleaner submitted bids | Vertical `BidCard` list | `BidList` with `BidCard` submitted variant | `Tabs`, `Card`, `Badge`, `Skeleton` | Medium | Add job status and next action. |
| `app/cleaner/messages/page.tsx` | Cleaner messages | Custom conversation rows | `MessageThreadPreview` list | `Card`, `Avatar`, `Badge`, `ScrollArea` | Medium | Needs thread route later. |
| `app/customer/my-home/page.tsx` | Customer home presets | `HomePresetsManager` accordion-like editor | `HomePresetManager` with `Accordion` or mobile `Drawer` editor | `Accordion`, `Drawer`, `Form`, `AlertDialog` | High | Duplicate IDs must be fixed during migration. |
| `app/customer/account/page.tsx` | Customer account | Simple account card | `AccountCard` | `Card`, `Avatar`, `Button`, `DropdownMenu` | Medium | Standardize with cleaner account. |
| `app/cleaner/account/page.tsx` | Cleaner account/settings | Account card plus `CleanerDefaultsForm` | `AccountCard`, `CleanerDefaultsForm`, `PriceInput`, availability `Switch` | `Card`, `Form`, `Input`, `Switch`, `Button` | High | Availability should read like a setting, not a generic form button. |
| `app/login/[[...rest]]/page.tsx` and `app/signup/[[...rest]]/page.tsx` | Auth | Clerk widgets inside custom `auth-shell` | `AuthShell` inspired by shadcn login blocks with Clerk backend | `Card`, `Button`, `Separator`, Clerk appearance | High | Modernize visual shell while preserving Clerk auth. |
| `components/site-header.tsx` and `components/account-user-button.tsx` | Account menu/header | Mixed account link and Clerk user button behavior | `AccountDropdown` | `DropdownMenu`, `Avatar`, `Button`, `Separator` | High | Account icon dropdown should work on both homeowner and cleaner sides. |

## Component Migration Matrix

| Current file/component | What it does now | Planned component | Planned pattern | Priority |
|---|---|---|---|---|
| `components/marketplace/cards.tsx` `JobRequestCard` | Customer job card | `JobCard` | Shared card with customer and cleaner variants | High |
| `components/marketplace/cards.tsx` `BidCard` | Bid display for customer and cleaner contexts | `BidCard` | Split variants: comparison, submitted, accepted, compact | High |
| `components/marketplace/cards.tsx` `RecommendedCleanerCard` | Cleaner recommendation card, appears unused | `CleanerCard` | Trust-forward cleaner identity card | Medium |
| `components/marketplace/cards.tsx` `AvailableJobCard` | Available job card, appears unused or superseded | `JobCard` cleaner variant | Consolidate into shared job card API | Medium |
| `components/marketplace/cards.tsx` `CleanerNearbyJobCard` | Nearby cleaner job card, appears unused or superseded | `NearbyJobCard` inside `NearbyJobSwipeCarousel` | Swipeable discovery card | High |
| `components/marketplace/cleaner-jobs-feed.tsx` `CleanerJobsFeed` | Nearby jobs list with pull-to-refresh | `NearbyJobSwipeCarousel` and `NearbyJobsSection` | Swipe carousel with accessible controls, ripple bid buttons, and fallback list | High |
| CSS `.cleaner-upnext-*` | Styling for up-next stack, no active component found | `JobStackScroll` and `UpNextJobsSection` | Scroll-stacked priority cards | High |
| `components/marketplace/status-pill.tsx` `StatusPill` | Generic status badge | `JobStatusBadge`, `BidStatusBadge` | shadcn `Badge` variants | High |
| `components/marketplace/mobile-nav.tsx` `MobileNav` | Fixed bottom nav | `BottomNav` | Role-aware app nav with valid routes only | High |
| `components/marketplace/job-request-form.tsx` `JobRequestForm` | Customer job wizard | `JobRequestWizard` | Stepper with shadcn form controls; notable continue/final post actions use pulsating primary | High |
| `LocationEditor` inside `job-request-form.tsx` | Inline home preset editor and custom combobox | `HomePresetPicker`, `HomePresetDrawer` | `Popover + Command` or `Drawer` on mobile | High |
| `components/marketplace/bid-form.tsx` `BidForm` | Cleaner bid form | `BidPanel`, `PriceInput`, `BidTimingPicker` | Focused task form; create/send bid uses pulsating primary | High |
| `components/marketplace/home-presets-manager.tsx` | Saved home manager | `HomePresetManager` | `Accordion` list and drawer/edit form | High |
| `components/marketplace/home-profile-form.tsx` | Home preset form | `HomeProfileForm` | shadcn form with stable ids | High |
| `components/marketplace/cleaner-defaults-form.tsx` | Cleaner rate defaults form | `CleanerDefaultsForm` with `PriceInput` | Settings card form | High |
| `components/onboarding/homeowner-onboarding-flow.tsx` | Progressive homeowner setup | `OnboardingStepper`, `SelectableCard` | shadcn `Progress`, `RadioGroup`, `ToggleGroup` | High |
| `components/marketplace/room-icons.tsx` | Room type SVG mapping | `RoomIcon` | Keep app wrapper, standardize icon style | Medium |
| `components/site-header.tsx` | Global site header | `SiteHeader`, `AppHeader` | Split marketing/auth/app chrome | High |
| `components/account-user-button.tsx` | Clerk user button wrapper | `AccountDropdown` / `AccountMenuButton` | Role-aware dropdown aligned with app shell | High |
| `components/sign-out-button.tsx` | Clerk sign out wrapper | `SignOutButton` | shadcn `Button` variant | Low |
| Job post success after `app/customer/jobs/create/route.ts` | Server creates customer job | `SuccessToast` event `job-posted` | Sonner toast: `Job posted` | High |
| Bid send success after `app/cleaner/jobs/[id]/bid/route.ts` | Server creates/updates cleaner bid | `SuccessToast` event `bid-sent` | Sonner toast: `Bid sent` | High |

## Route-Level Migration Matrix

| Current route | Planned page shell/components | Priority | Notes |
|---|---|---|---|
| `app/layout.tsx` | `RootShell`, `MarketingShell`, `AuthShell`, `AppShell` split | High | Avoid one global `main` layout for every surface. |
| `app/page.tsx` | Marketing landing using design tokens and shadcn buttons/cards | Medium | Keep bid-first language. |
| `app/login/[[...rest]]/page.tsx` | `AuthShell` inspired by shadcn login blocks | High | Integrate Clerk styling with design tokens. |
| `app/signup/[[...rest]]/page.tsx` | `AuthShell`, `RoleSelector`, shadcn login block-inspired layout | High | Make role choice visible. |
| `app/auth/continue/page.tsx` | `RedirectStatus` | Medium | Replace null fallback with progress/skeleton. |
| `app/welcome/page.tsx` | `AccountSetupForm` | High | Plain labels, field-level errors. |
| `app/onboarding/homeowner/page.tsx` | `OnboardingStepper` | High | Keep progressive mobile pattern, move to reusable primitives. |
| `app/customer/layout.tsx` | `CustomerAppShell`, `BottomNav` | High | Remove missing customer messages link until route exists. |
| `app/customer/page.tsx` | `CustomerHome`, `JobStackScroll`, `EmptyUpcomingJobs`, `TrustPanel`, `PulsatingPrimaryButton` | High | Homeowner open jobs use stack scroll. Main create/post action pulses. |
| `app/customer/jobs/page.tsx` | `JobListPage`, `JobCard`, `JobStatusBadge` | High | Archive/list view remains a normal list. |
| `app/customer/jobs/new/page.tsx` | `TaskShell`, `JobRequestWizard`, `PulsatingPrimaryButton`, `SuccessToast` | High | Avoid duplicate titles. Notable continue/final post actions pulse. Successful post shows `Job posted`. |
| `app/customer/jobs/[id]/page.tsx` | `JobDetailPage`, `JobTimeline`, `BidPanel` | High | Add confirmation for delete. |
| `app/customer/jobs/[id]/bids/page.tsx` | `BidComparePage`, `BidPanel`, `PaymentHeldBanner` | High | Clear payment and acceptance context. |
| `app/customer/my-home/page.tsx` | `HomePresetManager` | High | Use drawer or accordion editor. |
| `app/customer/account/page.tsx` | `AccountPage`, `AccountCard` | Medium | Match cleaner account structure. |
| `app/cleaner/layout.tsx` | `CleanerAppShell`, `BottomNav` | High | Hide nav on focused bid task if needed. |
| `app/cleaner/page.tsx` | `CleanerHome`, `JobStackScroll`, `NearbyJobSwipeCarousel`, `RippleActionButton`, `EmptyUpcomingJobs` | High | Up Next uses stack scroll; Nearby Jobs uses swipe carousel; nearby job "Bid" buttons use ripple. |
| `app/cleaner/jobs/[id]/page.tsx` | `BidTaskShell`, `BidPanel`, `PriceInput`, `PulsatingPrimaryButton`, `SuccessToast` | High | Keep the screen focused and low reading burden. Create/send bid button pulses. Successful submit shows `Bid sent`. |
| `app/cleaner/bids/page.tsx` | `BidListPage`, `BidCard` submitted variant | Medium | Add status filters. |
| `app/cleaner/messages/page.tsx` | `MessageListPage`, `MessageThreadPreview` | Medium | Preview rows become reusable. |
| `app/cleaner/account/page.tsx` | `CleanerAccountPage`, `CleanerDefaultsForm`, `PriceInput` | High | Convert availability to switch. |
| `app/checkout/success/page.tsx` | `PaymentResultPage`, `PaymentHeldBanner` if checkout remains | Medium | Current route references legacy booking paths. |
| `app/checkout/cancel/page.tsx` | `PaymentResultPage` | Medium | Current route references legacy booking paths. |

## New Components to Create

| New component | Source/migration | Used by | Priority |
|---|---|---|---|
| `JobStackScroll` | Skiper `skiper16` inspired | Customer home open jobs, cleaner up next jobs | High |
| `NearbyJobSwipeCarousel` | Skiper `skiper48` inspired | Cleaner nearby jobs | High |
| `PulsatingPrimaryButton` | Magic UI Pulsating Button inspired | Main continue/post/create bid actions | High |
| `RippleActionButton` | Magic UI Ripple Button inspired | Nearby job bid actions and general card/list tap feedback | High |
| `SuccessToast` | shadcn Sonner | Job posted and bid sent confirmations | High |
| `AuthShell` | shadcn login blocks inspired | Login, signup, welcome/account setup | High |
| `AccountDropdown` | shadcn DropdownMenu inspired | Top account icon menu on customer and cleaner app sides | High |
| `JobCard` | `JobRequestCard`, `AvailableJobCard`, `CleanerNearbyJobCard` | Job lists, stack, carousel | High |
| `BidCard` | Current `BidCard` | Bid compare, bid history, accepted bid | High |
| `BidPanel` | Bid compare and bid form screens | Customer bid compare, cleaner bid submit | High |
| `CleanerCard` | `RecommendedCleanerCard` | Bid cards, cleaner profiles | Medium |
| `PaymentHeldBanner` | New | Bid acceptance, checkout/payment states | High |
| `JobStatusBadge` | `StatusPill` | All job cards/details | High |
| `BottomNav` | `MobileNav` | Customer and cleaner app shells | High |
| `EmptyUpcomingJobs` | Empty states in dashboard/feed | Customer home, cleaner home | Medium |
| `PriceInput` | Bid/default forms | `BidPanel`, `CleanerDefaultsForm` | High |
| `JobTimeline` | New | Job detail, bid acceptance, payment states | Medium |
| `MessageThreadPreview` | Cleaner message row | Messages lists | Medium |

## Implementation Notes for the Later Build Phase

- Do not install Skiper or motion dependencies until the implementation phase.
- Decide whether to import from the Skiper registry or rebuild the behavior locally after reviewing source snippets.
- `JobStackScroll` likely needs `framer-motion`; evaluate whether `lenis` is necessary or too heavy for app flows.
- `NearbyJobSwipeCarousel` likely needs `swiper` plus `framer-motion`; evaluate bundle impact before installing.
- `PulsatingPrimaryButton` and `RippleActionButton` can be added from Magic UI during implementation, or rebuilt as variants over the shadcn button if that keeps the API cleaner.
- Add shadcn Sonner during implementation and mount `Toaster` once.
- Use success toasts only for confirmed success states: `Job posted` and `Bid sent`.
- Use shadcn login block layouts as inspiration for auth screens while keeping Clerk as the backend.
- Replace mixed account link/user-button behavior with a role-aware `AccountDropdown`.
- Every motion component needs a reduced-motion fallback.
- Every swipe interaction needs non-swipe controls for accessibility.
- Pulsating buttons should be limited to one visible attention-capturing action per screen.
- Ripple feedback should be used for quick tap acknowledgement, especially cleaner nearby job bid buttons and clickable cards.
