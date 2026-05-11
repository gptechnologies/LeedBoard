# UI Audit Before shadcn/ui Redesign

Context: Well Kept is a mobile-first home cleaning marketplace. The current UI is mostly custom CSS in `app/globals.css` with reusable marketplace components in `components/marketplace`. There is no `components/ui` directory and no shadcn setup yet.

This audit only documents the current UI. No code was modified or refactored.

## Executive Summary

- The app already has useful product-specific patterns: marketplace shell, bid cards, job cards, status pills, sticky action bars, bottom nav, and progressive onboarding.
- The highest-risk UI areas are the job posting wizard, cleaner bid screen, home preset manager, and navigation. These contain custom controls that would benefit from accessible shadcn/Radix primitives.
- Styling is centralized but inconsistent because `app/globals.css` contains legacy styles, later override blocks, duplicated component concepts, and conflicting radius/button/card definitions.
- No explicit loading states exist beyond `Suspense fallback={null}` and pull-to-refresh copy. Add route-level `loading.tsx` skeletons before the redesign ships.
- There are no real modals or drawers. Several inline editor and filter patterns are acting like popovers/drawers without the accessibility benefits.

## Recommended shadcn Foundation

Prioritize these shadcn components during redesign:

- `Button`, `Card`, `Badge`, `Alert`, `Separator`, `Avatar`
- `Form`, `Input`, `Textarea`, `Select`, `RadioGroup`, `Checkbox`, `ToggleGroup`, `Label`
- `Progress`, `Skeleton`, `Sheet`, `Drawer`, `Dialog`
- `Popover`, `Command`, `Calendar`, `ScrollArea`
- `Tabs`, `Accordion`, `DropdownMenu`, `NavigationMenu`

## Pages and Routes

| File path | What it does | Current UI problems | shadcn components to improve it | Reusable app component? | Priority |
|---|---|---|---|---|---|
| `app/layout.tsx` | Root shell with Clerk provider, global header, skip link, main container. | `main` width and padding are global, which constrains landing and app screens the same way. Header always renders even on onboarding/auth, creating competing chrome. | `NavigationMenu`, `Button`, app `AppShell`, app `AuthShell`. | Yes, split root, marketing, auth, and app shell wrappers. | High |
| `app/page.tsx` | Public landing page for homeowners and cleaners. | Uses custom hero, glass-card classes, manual CTA buttons. Copy says "Book" although product model is bid-first. Hero is text-heavy and not aligned with mobile app shell. | `Button`, `Card`, `Badge`, `Separator`. | Partly, landing sections can stay page-specific. | Medium |
| `app/login/[[...rest]]/page.tsx` | Clerk sign-in page. | Auth wrapper is custom and does not visually integrate Clerk card with app design. No loading/error wrapper around Clerk. | `Card`, `Alert`, `Button`, shadcn theme tokens for Clerk appearance. | Yes, `AuthPageShell`. | Medium |
| `app/signup/[[...rest]]/page.tsx` | Clerk sign-up with role redirect. | Same auth-shell issues as login. Role context is only in URL and supporting text, no visible role selector. | `Card`, `Tabs` or `RadioGroup`, `Alert`. | Yes, `AuthPageShell`, `RoleSelector`. | Medium |
| `app/auth/continue/page.tsx` | Transitional redirect page after Clerk auth. | `Suspense` fallback is null, so users can see a blank or static page with no progress indicator. | `Card`, `Progress` or `Skeleton`, `Alert` for failures. | Yes, `RedirectStatus`. | Medium |
| `app/welcome/page.tsx` | Completes local user record after Clerk signup. | Plain form, custom field styles, no grouped validation display, no role switch UI. Form does not feel like the mobile-first marketplace flow. | `Form`, `Input`, `Textarea`, `RadioGroup`, `Alert`, `Button`, `Card`. | Yes, `AccountSetupForm`. | High |
| `app/onboarding/homeowner/page.tsx` | Server wrapper for homeowner onboarding. | Delegates UI to component. Redirect logic is fine. | N/A directly. | No. | Low |
| `app/customer/layout.tsx` | Customer app layout with onboarding guard and mobile nav. | Bottom nav references `/customer/messages`, but no matching page exists in this repo. Header plus bottom nav can crowd small screens. | `NavigationMenu`, app `MobileTabBar`. | Yes. | High |
| `app/customer/page.tsx` | Customer dashboard with post-job CTA, open jobs, how-it-works, trust panel. | Empty open jobs section silently disappears, leaving "How it works" without a job-empty CTA. Cards and trust panel are custom. Hero card uses inline SVG. | `Card`, `Button`, `Badge`, `Alert`, `Avatar`, `Separator`. | Yes, `DashboardHeroAction`, `TrustPanel`, `EmptyState`. | High |
| `app/customer/jobs/page.tsx` | Customer jobs list. | Empty state is basic. Job list has no filters, no status grouping, no loading state. | `Card`, `Badge`, `Button`, `Tabs`, `Select`, `Skeleton`, `Alert`. | Yes, `JobList`, `EmptyState`. | High |
| `app/customer/jobs/new/page.tsx` | New job page wrapper. | Header duplicates title already inside form. Error notice is a generic div. | `Alert`, `Card`, app `PageHeader`. | Yes, `PageHeader`. | Medium |
| `app/customer/jobs/[id]/page.tsx` | Customer job detail and accepted bid management. | Summary is a vertical `strong/span` list, difficult to scan. Delete action is immediate with no confirmation. Sticky bottom action may overlap bottom nav. | `Card`, `Badge`, `AlertDialog`, `DescriptionList` app wrapper, `Button`, `Separator`. | Yes, `JobDetailSummary`, `StickyActionBar`. | High |
| `app/customer/jobs/[id]/bids/page.tsx` | Customer bid comparison and accept flow. | Only top 3 bids shown without richer comparison controls. Accept bid submits immediately, no confirmation. "Compare Bids" anchor points to `#main-content`, not a comparison region. | `Card`, `Badge`, `AlertDialog`, `RadioGroup`, `Button`, `Table` or app comparison cards. | Yes, `BidComparisonList`, `BidAcceptAction`. | High |
| `app/customer/account/page.tsx` | Customer account summary. | Very thin page, mixed Clerk user button and custom sign out. Account actions look like unrelated buttons. | `Card`, `Button`, `DropdownMenu`, `Separator`, `Avatar`. | Yes, `AccountCard`. | Medium |
| `app/customer/my-home/page.tsx` | Customer saved home presets page. | Good concept, but editor expansion can create long nested form sections. Needs clearer empty state and destructive confirmation. | `Accordion`, `Card`, `Button`, `AlertDialog`, `Form`, `Input`, `Select`, `RadioGroup`. | Yes, `HomePresetManager`. | High |
| `app/cleaner/layout.tsx` | Cleaner app layout with mobile nav. | No auth guard here unlike customer layout, likely handled per page. Bottom nav and global header may duplicate navigation. | App `MobileTabBar`, `NavigationMenu`. | Yes. | Medium |
| `app/cleaner/page.tsx` | Cleaner dashboard showing nearby jobs feed. | Filter button has no behavior. Pull-to-refresh is custom and has minimal loading feedback. Empty state lacks action or expectations. | `Button`, `Sheet` or `Drawer`, `Skeleton`, `Card`, `Badge`, `Alert`. | Yes, `CleanerJobsFeed`. | High |
| `app/cleaner/jobs/[id]/page.tsx` | Cleaner job detail and bid form. | Mobile-focused screen uses bespoke header and cards. Job details are compressed. Bid form has many custom controls and no validation summary. | `Card`, `Button`, `Form`, `Input`, `Textarea`, `Select`, `ToggleGroup`, `RadioGroup`, `Alert`. | Yes, `BidScreen`, `JobBriefCard`. | High |
| `app/cleaner/bids/page.tsx` | Cleaner submitted bids list. | Uses same bid cards as customer-facing views, but cleaner context needs bid status, job status, and next actions. Empty state is passive. | `Tabs`, `Card`, `Badge`, `Button`, `Skeleton`, `EmptyState` app wrapper. | Yes, `BidList`. | Medium |
| `app/cleaner/messages/page.tsx` | Cleaner conversation list based on bids. | No actual message thread route. Conversation rows are custom list items. Empty state is passive. | `Card`, `Avatar`, `Badge`, `ScrollArea`, `Tabs`, `Skeleton`. | Yes, `ConversationList`. | Medium |
| `app/cleaner/account/page.tsx` | Cleaner profile/account and default bid settings. | Availability toggle is a form submit button, not visually a switch. Defaults form lacks currency affordances and validation hints. | `Switch`, `Form`, `Input`, `Card`, `Button`, `Alert`, `Separator`. | Yes, `AccountCard`, `CleanerDefaultsForm`. | High |
| `app/checkout/success/page.tsx` | Legacy booking payment success page. | References booking routes not present in current route tree. Uses older `.panel`, `.card`, `.grid two` styles, visually divergent from marketplace. | `Card`, `Button`, `Alert`, `Separator`. | Probably archive or rebuild if checkout remains. | Medium |
| `app/checkout/cancel/page.tsx` | Legacy booking payment cancel page. | References `/customer/book`, not present. Uses old panel styles. | `Card`, `Alert`, `Button`. | Probably archive or rebuild if checkout remains. | Medium |
| `app/auth/onboarding/route.ts` and other `route.ts` files | Server actions/API endpoints for auth, jobs, bids, presets, settings, checkout, webhooks. | No direct UI, but errors are passed as raw query strings and rendered in generic notices. | Standardize page-level `Alert` and validation error mapping. | Yes, `FormErrorAlert`. | Medium |

## Reusable Components

| File path | What it does | Current UI problems | shadcn components to improve it | Reusable app component? | Priority |
|---|---|---|---|---|---|
| `components/site-header.tsx` | Global brand/header navigation. | Customer sees "Account" link while cleaner sees Clerk user button, inconsistent. Public nav is crowded on mobile. | `NavigationMenu`, `Button`, `DropdownMenu`, `Avatar`. | Yes, `SiteHeader` should remain but be redesigned. | High |
| `components/marketplace/mobile-nav.tsx` | Fixed bottom navigation for customer/cleaner roles. | Customer nav links to missing `/customer/messages`. Icons are hand-written SVG. Active matching is simple but okay. Does not expose `aria-label`. | `Button`, app `MobileTabBar`, lucide icons. | Yes. | High |
| `components/account-user-button.tsx` | Thin wrapper around Clerk `UserButton`. | No visual integration except Clerk defaults. | Clerk appearance plus `DropdownMenu` patterns for app-owned actions. | Yes, but keep thin. | Low |
| `components/sign-out-button.tsx` | Clerk sign-out button wrapper. | Button style is global and may not match account menu context. | `Button` variant `outline` or `ghost`. | Yes. | Low |
| `components/marketplace/cards.tsx` | Job, bid, cleaner, and available job card components. | Several card types live in one large file. `RecommendedCleanerCard`, `AvailableJobCard`, `CleanerNearbyJobCard` appear unused or partially superseded. Job cards use a left accent stripe, which conflicts with current design guidance. | `Card`, `CardHeader`, `CardContent`, `Badge`, `Avatar`, `Button`, `Separator`. | Yes, split into `JobCard`, `BidCard`, `CleanerCard`. | High |
| `components/marketplace/status-pill.tsx` | Status badge with dot and tone. | Duplicates `.status-pill` and `.status-badge` CSS names. No `aria-label` or semantic status mapping. | `Badge` with tone variants. | Yes, `StatusBadge`. | High |
| `components/marketplace/room-icons.tsx` | Custom room SVG icons. | Good domain mapping, but hand-written icons vary from nav/icon styles. Some icons use `aria-label` inside decorative contexts. | Use lucide icons where possible, keep app wrapper for room mapping. | Yes. | Medium |
| `components/marketplace/job-request-form.tsx` | Multi-step customer job posting wizard with inline home preset editor and scheduling. | Largest UI risk. Custom segmented controls, custom combobox, date strip, custom time picker, hidden form state, sticky actions, and validation messages are all bespoke. Progress CSS originally had 4 columns then override to 3. | `Form`, `Input`, `Textarea`, `Select`, `RadioGroup`, `ToggleGroup`, `Popover`, `Command`, `Calendar`, `Progress`, `Alert`, `Button`, `Card`. | Yes, split into wizard primitives and app-specific steps. | High |
| `components/marketplace/bid-form.tsx` | Cleaner bid creation/update form. | Preset cards, pricing toggle, chip grid, custom price input, and sticky submit are bespoke. No schema-driven field errors. | `Form`, `Input`, `Textarea`, `RadioGroup`, `ToggleGroup`, `Card`, `Button`, `Alert`. | Yes, `BidForm` plus `PriceInput`. | High |
| `components/marketplace/home-presets-manager.tsx` | Expand/collapse manager for saved homes. | Home preset editors are inline and can make the page very long. Delete action has no confirmation. Uses accordion behavior without Accordion semantics. | `Accordion`, `AlertDialog`, `Card`, `Button`, `Badge`. | Yes. | High |
| `components/marketplace/home-profile-form.tsx` | Home preset create/update form. | Form ids repeat if multiple forms are expanded at once, causing label/input collisions. Pet toggle is custom radio cards. Sticky submit inside expanded card can feel odd. | `Form`, `Input`, `Textarea`, `Select`, `RadioGroup`, `Button`, `Card`. | Yes. | High |
| `components/marketplace/cleaner-defaults-form.tsx` | Cleaner default rate and ETA form. | Inputs lack currency prefixes, helper text, validation/error state, and mobile grouping. | `Form`, `Input`, `Card`, `Button`, app `CurrencyInput`. | Yes. | High |
| `components/marketplace/cleaner-jobs-feed.tsx` | Cleaner nearby jobs list with pull-to-refresh. | Filter button is nonfunctional. Pull-to-refresh is custom and not keyboard-relevant. Refresh feedback is text-only, no skeleton state. | `Sheet` or `Drawer`, `Button`, `Card`, `Badge`, `Skeleton`, `ScrollArea`. | Yes. | High |
| `components/onboarding/homeowner-onboarding-flow.tsx` | Progressive homeowner setup flow. | Good mobile-first shape, but custom progress, choice cards, number grid, and actions. Address step validation has no final submit path through `goNext`, and submit relies on button disabled state only. | `Progress`, `Card`, `Button`, `RadioGroup`, `ToggleGroup`, `Form`, `Input`, `Alert`. | Yes, split `OnboardingShell`, `ChoiceCard`, `Stepper`. | High |

## Forms

| File path | What it does | Current UI problems | shadcn components to improve it | Reusable app component? | Priority |
|---|---|---|---|---|---|
| `app/welcome/page.tsx` | First/last/email/phone/bio setup. | Server errors only via generic query notice. No field-level errors. | `Form`, `Input`, `Textarea`, `Alert`. | Yes. | High |
| `components/marketplace/job-request-form.tsx` | Job creation wizard. | Too much state in one component. Custom controls need accessibility hardening. Validation messages are manual and not linked to fields. | `Form`, `RadioGroup`, `Select`, `Calendar`, `Popover`, `Progress`, `Alert`. | Yes. | High |
| `components/marketplace/bid-form.tsx` | Cleaner bid form. | Custom pricing input and presets need reusable form controls. Disabled state only covers time-slot date. | `Form`, `Input`, `ToggleGroup`, `Textarea`, `Button`. | Yes. | High |
| `components/marketplace/home-profile-form.tsx` | Home preset form. | Duplicate `id` values when multiple editors render. No destructive confirmation in parent. | `Form`, `Input`, `RadioGroup`, `Select`, `Textarea`. | Yes. | High |
| `components/marketplace/cleaner-defaults-form.tsx` | Default bid settings. | Needs currency and numeric formatting, helper text, and validation. | `Form`, `Input`, `Card`, `Button`. | Yes. | High |
| `components/onboarding/homeowner-onboarding-flow.tsx` | Homeowner onboarding form. | Custom stepper and controls. Address errors only local, no server error field mapping. | `Form`, `Progress`, `RadioGroup`, `ToggleGroup`, `Alert`. | Yes. | High |
| Inline delete/accept forms in job pages | Delete job, delete preset, accept bid, availability toggle. | Destructive and commitment actions submit immediately. | `AlertDialog`, `Button`, `Switch`. | Yes, `ConfirmSubmitButton`. | High |

## Cards

| Pattern | Current locations | Current UI problems | shadcn improvement | Reusable app component? | Priority |
|---|---|---|---|---|---|
| Marketplace cards | `components/marketplace/cards.tsx`, many pages | Card styles are broad CSS classes with hover applied to all `.market-card`. Some cards are links, some articles, some forms. | shadcn `Card` with explicit variants: clickable, summary, bid, job, account. | Yes. | High |
| Empty state cards | `.market-empty`, `.empty-state` across pages | Multiple empty-state classes with different visual systems. Often passive and lacks next action. | App `EmptyState` built with `Card`, optional `Button`. | Yes. | High |
| Account cards | customer and cleaner account pages | Same structure repeated. Mixed account menu, sign out, and profile defaults. | `Card`, `Avatar`, `DropdownMenu`, `Separator`. | Yes. | Medium |
| Job detail summary cards | customer and cleaner detail pages | Dense vertical lists with low hierarchy. | `Card`, app `DescriptionList`, `Separator`, `Badge`. | Yes. | High |
| Preset/choice cards | forms and onboarding | Repeated custom selected-card pattern across job posting, bidding, onboarding, and presets. | `ToggleGroup`, `RadioGroup`, app `SelectableCard`. | Yes. | High |

## Buttons and Actions

| Pattern | Current locations | Current UI problems | shadcn improvement | Reusable app component? | Priority |
|---|---|---|---|---|---|
| Global buttons | `.button`, `.button-link`, `button[type="submit"]` in `app/globals.css` | Global selector styles every submit button, making context-specific buttons hard to control. | shadcn `Button` variants. | Yes, use `components/ui/button`. | High |
| Destructive actions | Delete job, delete home preset | No confirmation, no destructive styling system beyond `secondary-submit`. | `AlertDialog` plus `Button variant="destructive"`. | Yes, `ConfirmSubmitButton`. | High |
| Sticky actions | job wizard, bid form, job detail bottom action | Sticky bars can overlap mobile nav and each other. Styling is duplicated. | App `StickyActionBar` with `Button`. | Yes. | High |
| Icon buttons | back button, nav icons, hero arrows, edit buttons | Hand-written SVG and text arrows. Some controls lack labels or tooltips. | `Button` icon variants, lucide icons, optional `Tooltip`. | Yes. | Medium |

## Modals, Drawers, Popovers

| Pattern | Current locations | Current UI problems | shadcn improvement | Reusable app component? | Priority |
|---|---|---|---|---|---|
| Modals/dialogs | None found | Confirmations are missing for destructive and commitment actions. | `AlertDialog`, `Dialog`. | Yes. | High |
| Drawers/sheets | None found | Mobile filter button exists but opens nothing. Home preset/location editor could be a drawer on small screens. | `Drawer` or `Sheet`. | Yes. | High |
| Popovers/comboboxes | `LocationEditor` custom preset menu | Custom listbox lacks full keyboard handling, focus management, and outside-click handling. | `Popover` plus `Command`, or `Select` if simple. | Yes. | High |

## Navigation

| File path | What it does | Current UI problems | shadcn components to improve it | Reusable app component? | Priority |
|---|---|---|---|---|---|
| `components/site-header.tsx` | Public/auth/app top nav. | Different account treatment by role. Header may be unnecessary on full-screen mobile flows. | `NavigationMenu`, `DropdownMenu`, `Button`. | Yes. | High |
| `components/marketplace/mobile-nav.tsx` | Bottom role nav. | Missing customer messages route, no nav label, custom SVG icons. | App `MobileTabBar`, lucide icons, `Button` semantics. | Yes. | High |
| `app/customer/layout.tsx` | Customer nav wrapper. | Onboarding redirect is good, but no route-specific nav hiding for job/bid full-screen flows. | App shell layout. | Yes. | Medium |
| `app/cleaner/layout.tsx` | Cleaner nav wrapper. | No route-specific nav hiding for bid screen. | App shell layout. | Yes. | Medium |

## Empty States

| Location | Current state | Problems | shadcn/app improvement | Priority |
|---|---|---|---|---|
| Customer jobs | `app/customer/jobs/page.tsx` | Has CTA, good base. Needs icon and clearer next step. | `EmptyState` with `Card`, `Button`, optional icon. | Medium |
| Customer dashboard open jobs | `app/customer/page.tsx` | No empty state rendered inside "Open Jobs". | Reuse `EmptyState` with "Post job" CTA. | High |
| Job bids | `app/customer/jobs/[id]/bids/page.tsx` | Passive waiting copy. | Add expectation, refresh hint, and status badge. | Medium |
| Cleaner feed | `components/marketplace/cleaner-jobs-feed.tsx` | Passive empty state, no settings/action path. | Link to account/settings or availability. | Medium |
| Cleaner bids/messages | `app/cleaner/bids/page.tsx`, `app/cleaner/messages/page.tsx` | Passive empty states. | Add CTA to browse jobs. | Medium |
| Home presets | `components/marketplace/home-presets-manager.tsx` | Helpful copy, but add action should be visually connected. | `EmptyState` with inline add action. | Medium |
| Checkout success missing booking | `app/checkout/success/page.tsx` | Minimal h1 only. | `Alert` and recovery button. | Low |

## Loading States

| Area | Current state | Problems | shadcn/app improvement | Priority |
|---|---|---|---|---|
| Route loading | No `loading.tsx` files found | Server-rendered pages can appear blank during navigation. | Add route-level `Skeleton` screens for customer, cleaner, job detail, bids. | High |
| Auth continue | `Suspense fallback={null}` | Blank fallback while bridge loads. | `Progress` or `Skeleton`. | Medium |
| Cleaner refresh | Pull-to-refresh text only | No card skeletons or disabled filter/action states. | `Skeleton` rows and refresh status. | Medium |
| Form submissions | Native POSTs and disabled states only in some places | No pending UI for many submits. | `SubmitButton` with pending state using `useFormStatus`. | High |

## Mobile Responsiveness Issues

- `app/globals.css` has multiple mobile override blocks that compete. Redesign should consolidate responsive rules near the component that owns them.
- Sticky submit bars and sticky bottom actions can stack with `MobileNav`; define one app-level bottom safe-area strategy.
- `components/marketplace/home-profile-form.tsx` can render duplicate field IDs when multiple home preset editors are expanded.
- `components/marketplace/job-request-form.tsx` uses a custom date strip and time slot layout that needs more 320px testing, especially with long labels and large text settings.
- Global `main` width/padding affects landing, auth, onboarding, and app routes uniformly, but these surfaces need different shells.
- Customer bottom nav includes a missing messages route, which is a mobile navigation dead end.
- `how-it-works` remains a 3-column mini-grid until 380px, which may be cramped between 381px and 720px.

## Repeated UI Patterns to Extract

- `AppShell`, `PageHeader`, `AuthPageShell`
- `MobileTabBar`
- `StatusBadge`
- `EmptyState`
- `StickyActionBar`
- `ConfirmSubmitButton`
- `JobCard`, `BidCard`, `JobSummaryCard`
- `AccountCard`
- `SelectableCard`, backed by `RadioGroup` or `ToggleGroup`
- `CurrencyInput`
- `FormErrorAlert`
- `TrustSignalRow`

## Inconsistent Styling and Class Issues

- `app/globals.css` defines tokens once in hex and later overrides them with OKLCH. Keep one token block.
- `--radius-card` starts at `8px` then later becomes `16px`; `--radius-control` starts at `4px` then becomes `12px`.
- Button styles apply to `button[type="submit"]` globally, which makes local form buttons inherit primary styling unintentionally.
- `.status-pill` and `.status-badge` both exist, while `StatusPill` renders `status-badge`.
- `.market-card:hover` applies broadly, including cards that may not be interactive.
- `cards.tsx` contains unused or superseded components, which makes the card API harder to reason about.
- Hand-written SVG icons are repeated across nav, hero, cards, time controls, and room icons. Standardize with lucide plus domain wrappers.
- The codebase has both legacy booking UI classes (`panel`, `card`, `empty-state`, `grid two`) and newer marketplace classes (`market-card`, `market-empty`, `market-shell`).

## Priority Redesign Order

1. Install/configure shadcn foundation and tokens after this audit is approved.
2. Replace global button/card/alert/form primitives with shadcn-backed `components/ui`.
3. Build reusable app primitives: `AppShell`, `MobileTabBar`, `PageHeader`, `EmptyState`, `StatusBadge`, `StickyActionBar`.
4. Redesign high-risk flows: customer job wizard, bid comparison, cleaner bid screen, home presets, cleaner account defaults.
5. Add loading skeletons and pending submit states.
6. Clean up legacy checkout/booking screens or remove them from the active product surface if no longer used.
