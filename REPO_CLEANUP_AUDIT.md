# Repository Cleanup Audit

Date: 2026-05-10  
Repo: `ArchmontCleaners`

## Executive Summary

This is a Next.js App Router application for the Well Kept cleaning marketplace. At the start of this audit, the repo contained two overlapping product directions:

- Current direction: bid-first marketplace where homeowners post jobs and cleaners submit bids.
- Older direction: fixed-price booking flow with Stripe Checkout, assigned cleaners, booking slots, and service catalog pricing.

The selected product direction is the bid-first marketplace: homeowners post jobs and cleaners bid on those jobs. The fixed-price booking UI has been removed where it was not part of the protected Stripe/API or Prisma/database template.

Protected areas intentionally not touched in this pass:

- Prisma schema/database models
- Stripe/API payment template routes
- Global CSS pruning
- `.env` files
- `.gitignore`

## Current Repo Structure

```text
.
├── app/                         Next.js App Router pages, layouts, and route handlers
│   ├── api/                     Protected payment template route handlers
│   ├── auth/                    Auth continuation and onboarding handlers
│   ├── checkout/                Protected payment template success/cancel pages
│   ├── cleaner/                 Cleaner dashboard, account, bids, jobs, and messages
│   ├── customer/                Customer dashboard, job posting, bids, home profiles, and account
│   ├── login/                   Clerk login route
│   ├── onboarding/              Homeowner onboarding flow
│   ├── signup/                  Clerk signup route
│   ├── globals.css              Global CSS for both old booking UI and current marketplace UI
│   ├── layout.tsx               Root layout, Clerk provider, global site header
│   └── page.tsx                 Public landing page
├── components/                  Shared React components
│   ├── marketplace/             Current marketplace cards, forms, nav, bid UI, home profile UI
│   ├── onboarding/              Homeowner onboarding component
│   └── *.tsx                    Shared app shell/auth/account components
├── lib/                         Server/domain helpers
│   ├── marketplace*.ts          Current bid marketplace reads, form parsing, constants
│   ├── bookings.ts              Protected payment/booking template helper
│   ├── pricing.ts               Protected payment/booking template pricing helper
│   ├── stripe.ts                Protected Stripe client helper
│   ├── session.ts               Clerk/user session helpers
│   └── prisma.ts                Prisma client singleton
├── prisma/                      Prisma schema and seed data
├── output/                      Local Playwright screenshots; untracked artifact
├── node_modules/                Installed dependencies; ignored artifact
├── .next/                       Next.js build/dev output; ignored artifact
├── .env                         Local secrets/config; ignored
├── .env.example                 Committed env template
├── DESIGN.md                    Current design context
├── PRODUCT.md                   Current product context
├── cleaning_marketplace_mvp_handoff.md  Older long-form MVP plan
├── todo.md                      Untracked working TODO list
├── package.json                 Scripts and dependencies
├── package-lock.json            Locked npm dependency graph
├── tsconfig.json                TypeScript config
├── tsconfig.tsbuildinfo         Local incremental build cache; untracked artifact
└── next.config.ts               Next.js config
```

## High-Confidence Cleanup Candidates

These can usually be removed locally without product decisions, assuming no one needs the current local snapshots.

| Path | Status | Why it looks unnecessary |
| --- | --- | --- |
| `.next/` | ignored, 1.5 GB | Generated Next.js build/dev output. Recreated by `npm run dev` or `npm run build`. |
| `node_modules/` | ignored, 688 MB | Installed dependencies. Recreated by `npm install`. |
| `tsconfig.tsbuildinfo` | untracked | TypeScript incremental cache. Should be ignored. |
| `output/playwright/*.png` | untracked | Local browser verification screenshots. Useful temporarily, not source. |
| `dev.db` | ignored | Local database artifact. Current Prisma config points at Postgres/Neon-style env vars, so this looks historical/local only. |
| `scripts/` | local empty dir | No files inside; likely leftover scaffold. |
| `app/auth/signup/` | local empty dir | Empty route directory, not tracked by git. |
| `app/auth/login/` | local empty dir | Empty route directory, not tracked by git. |
| `app/auth/logout/` | local empty dir | Empty route directory, not tracked by git. |
| `app/logout/` | local empty dir | Empty route directory, not tracked by git. |

## Markdown And Planning Files

| Path | Status | Recommendation |
| --- | --- | --- |
| `PRODUCT.md` | tracked | Keep. It reflects the current bid-first marketplace strategy. |
| `DESIGN.md` | tracked | Keep. It reflects the current visual system. |
| `cleaning_marketplace_mvp_handoff.md` | tracked | Archive or delete after confirmation. It describes an older managed-service/fixed-booking POC and conflicts with current bid-first direction. |
| `todo.md` | untracked | Fold active items into issues or a current task tracker, then remove. Several items appear to correspond to ongoing UI edits. |
| `REPO_CLEANUP_AUDIT.md` | new | This audit file. Keep during cleanup, then archive/delete when no longer needed. |

## Product-Era Overlap

The repo is now oriented around the active bid marketplace surface. Some payment-template code remains protected for later Stripe work.

### Current Bid Marketplace Surface

Likely active:

- `app/customer/jobs/**`
- `app/customer/my-home/**`
- `app/customer/page.tsx`
- `app/cleaner/jobs/**`
- `app/cleaner/bids/page.tsx`
- `app/cleaner/messages/page.tsx`
- `app/cleaner/account/page.tsx`
- `components/marketplace/**`
- `lib/marketplace.ts`
- `lib/marketplace-form.ts`
- `lib/marketplace-constants.ts`

### Removed Fixed-Price Booking UI

Removed in this cleanup pass:

- `app/customer/book/page.tsx`
- `components/booking-form.tsx`
- `app/customer/bookings/**`
- `app/cleaner/bookings/**`
- `app/admin/page.tsx`
- `components/submit-button.tsx`
- `components/status-badge.tsx`
- booking-only cleaner dashboard references
- booking-only admin navigation references

Protected and intentionally still present:

- `app/api/bookings/create-checkout/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/checkout/success/page.tsx`
- `app/checkout/cancel/page.tsx`
- `lib/bookings.ts`
- `lib/pricing.ts`
- `lib/stripe.ts`
- Booking-related Prisma models

Note: the protected payment template still contains redirects/links to removed fixed-booking pages. This was left untouched by request and should be revisited when Stripe is intentionally wired into the bid marketplace flow.

## Potentially Broken Or Stale Routes

| Path or reference | Finding | Recommendation |
| --- | --- | --- |
| `components/marketplace/mobile-nav.tsx` -> `/customer/messages` | Customer nav links to `/customer/messages`, but no `app/customer/messages/page.tsx` exists. | Add the page or remove/change the nav item. |
| `app/customer/jobs/home-profile/route.ts` | Untracked route handler. It may be legitimate current work, but it is not in git. | Confirm and either add it or remove it. |
| `components/marketplace/room-icons.tsx` | No imports found. | Remove if room icon work has moved elsewhere, or wire it into the room display UI. |
| protected checkout/API template redirects | Some protected payment-template code still points at removed `/customer/book` and `/customer/bookings/[id]` pages. | Leave for now per cleanup constraint; update when Stripe is implemented for accepted bids. |

## Styling Debt

`app/globals.css` is 5,070 lines and appears to contain both older booking styles and newer marketplace/mobile styles. It was intentionally not pruned in this pass.

Future cleanup targets:

- `.booking-*`
- `.service-card*` where only used by `components/booking-form.tsx`
- Old checkout/admin table/status styles if fixed booking is removed
- Duplicate or superseded mobile nav/site header blocks

## Git And Local State Notes

The working tree is dirty. I did not change or remove existing source files.

Modified tracked files at audit time included:

- `app/cleaner/jobs/[id]/page.tsx`
- `app/cleaner/messages/page.tsx`
- `app/cleaner/page.tsx`
- `app/globals.css`
- `app/onboarding/homeowner/complete/route.ts`
- `app/onboarding/homeowner/page.tsx`
- `app/page.tsx`
- `app/welcome/page.tsx`
- multiple `components/marketplace/*` files
- `components/onboarding/homeowner-onboarding-flow.tsx`
- `lib/format.ts`
- `lib/marketplace-constants.ts`
- `lib/marketplace-form.ts`
- `lib/marketplace.ts`
- `prisma/schema.prisma`

Untracked files at audit time:

- `app/customer/jobs/home-profile/route.ts`
- `output/playwright/*.png`
- `todo.md`
- `tsconfig.tsbuildinfo`
- `REPO_CLEANUP_AUDIT.md`

## `.gitignore` Issues

The current `.gitignore` ignores the main generated artifacts, but it also contains env-var-looking lines. This file was intentionally not changed in this pass.

```text
DATABASE_URL="..."
DIRECT_DATABASE_URL="..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/signup"
STRIPE_SECRET_KEY="..."
```

Those lines are not useful ignore rules. They look like copied env example content and can be removed later. Keep env templates in `.env.example`.

Recommended additions:

```gitignore
tsconfig.tsbuildinfo
output/
*.tsbuildinfo
```

Optional additions if local DB files should never be committed:

```gitignore
*.db
*.db-journal
```

## Recommended Cleanup Sequence

1. Resolve untracked current work: decide whether `app/customer/jobs/home-profile/route.ts` and `todo.md` should be committed, archived, or deleted.
2. Add or remove the customer messages nav target.
3. Decide whether `components/marketplace/room-icons.tsx` should be wired into active job cards or removed.
4. When ready for Stripe, replace the protected fixed-booking redirects/links with accepted-bid payment flow URLs.
5. Later, in a separate pass, prune global CSS tied only to removed fixed-booking pages/components.
6. Later, in a separate pass, clean `.gitignore` and local generated artifacts if desired.
7. Re-run `npm run build` and smoke-test core routes: `/`, `/customer`, `/customer/jobs/new`, `/customer/jobs`, `/cleaner`, `/cleaner/jobs/[id]`, `/cleaner/bids`.

## Cleanup Risk Levels

Low risk:

- `.next/`
- `node_modules/`
- `output/playwright/`
- `tsconfig.tsbuildinfo`
- empty local directories
- `.gitignore` cleanup in a later pass

Medium risk:

- `todo.md`
- `cleaning_marketplace_mvp_handoff.md`
- `components/marketplace/room-icons.tsx`
- customer messages nav/page mismatch

High risk:

- Booking-related Prisma models
- Stripe checkout routes
- Global CSS pruning before route/component removal
