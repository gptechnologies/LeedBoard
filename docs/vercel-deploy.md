# Vercel Deployment Setup

## What Changed

This app is now prepared for Vercel deployment with:

- Prisma configured for Neon Postgres
- Clerk handling customer and provider authentication
- no SQLite dependency in the runtime path
- dynamic rendering for database-backed pages so Vercel builds do not try to prerender live data
- build scripts that run `prisma generate` automatically

## Required Environment Variables

Set these in Vercel Project Settings before the first deploy:

### Required for a successful build

- `DATABASE_URL`
  - Neon pooled connection string used by the runtime app
- `DIRECT_DATABASE_URL`
  - Neon direct connection string used by Prisma CLI and seed scripts
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - Clerk publishable key
- `CLERK_SECRET_KEY`
  - Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
  - set to `/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
  - set to `/signup`

### Required for live Stripe checkout

- `STRIPE_SECRET_KEY`
  - your Stripe secret key

### Required for Stripe webhooks

- `STRIPE_WEBHOOK_SECRET`
  - the webhook signing secret for `/api/webhooks/stripe`

## First-Time Deployment Steps

1. Create the Vercel project and connect the GitHub repository.
2. Install the Neon integration in Vercel or create a Neon project directly.
3. Add the pooled Neon URL as `DATABASE_URL`.
4. Add the direct Neon URL as `DIRECT_DATABASE_URL`.
5. Install Clerk in Vercel Marketplace or create a Clerk app and copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
6. In Clerk, enable the sign-in methods you want to offer:
   - Email/password
   - Google OAuth if you want Gmail sign-in
7. Add `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup`.
8. Add `STRIPE_SECRET_KEY`.
9. Deploy once so the app builds successfully.
10. After the database is connected, push the schema and seed the baseline data:

```bash
DIRECT_DATABASE_URL="your-neon-direct-url" DATABASE_URL="your-neon-pooled-url" npm run db:push
DIRECT_DATABASE_URL="your-neon-direct-url" DATABASE_URL="your-neon-pooled-url" npm run db:seed
```

11. In Stripe, create a webhook that points to:

```text
https://YOUR-VERCEL-DOMAIN/api/webhooks/stripe
```

12. Copy the Stripe signing secret into `STRIPE_WEBHOOK_SECRET`.
13. Redeploy after the webhook secret is added.

## What `db:seed` Creates

The seed step inserts:

- the default admin user record
- the default service catalog
- the default add-ons
- the next 14 days of service windows

## Admin Access

- The seed creates an admin record for `admin@archmontcleaners.local`.
- Sign into Clerk with that same email address to attach the Clerk identity to the seeded admin record.
- For production, replace this address with your real operations admin email before seeding.

## Notes

- The app no longer depends on `NEXT_PUBLIC_APP_URL` for Stripe redirects. It derives the base URL from the incoming request, which works for Vercel preview and production deployments.
- Do not rely on runtime seeding in production. Always run `db:push` and `db:seed` explicitly against the target database.
- Business roles remain in the application database, even though Clerk manages authentication. Customers and providers complete one onboarding step after the first sign-in so the app can assign the correct role.
