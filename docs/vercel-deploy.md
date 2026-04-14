# Vercel Deployment Setup

## What Changed

This app is now prepared for Vercel deployment with:

- Prisma configured for PostgreSQL
- no SQLite dependency in the runtime path
- dynamic rendering for database-backed pages so Vercel builds do not try to prerender live data
- build scripts that run `prisma generate` automatically

## Required Environment Variables

Set these in Vercel Project Settings before the first deploy:

### Required for a successful build

- `DATABASE_URL`
  - PostgreSQL connection string
  - example: `postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require`

### Required for live Stripe checkout

- `STRIPE_SECRET_KEY`
  - your Stripe secret key

### Required for Stripe webhooks

- `STRIPE_WEBHOOK_SECRET`
  - the webhook signing secret for `/api/webhooks/stripe`

## Recommended Database Provider

Use one of these for initial testing:

- Vercel Postgres
- Neon
- Supabase Postgres

For a first deployment, Vercel Postgres is the simplest path because it plugs directly into the Vercel project.

## First-Time Deployment Steps

1. Create the Vercel project and connect the GitHub repository.
2. Add a PostgreSQL database and copy its connection string into `DATABASE_URL`.
3. Add `STRIPE_SECRET_KEY`.
4. Deploy once so the app builds successfully.
5. After the database is connected, push the schema and seed the baseline data:

```bash
DATABASE_URL="your-postgres-url" npm run db:push
DATABASE_URL="your-postgres-url" npm run db:seed
```

6. In Stripe, create a webhook that points to:

```text
https://YOUR-VERCEL-DOMAIN/api/webhooks/stripe
```

7. Copy the Stripe signing secret into `STRIPE_WEBHOOK_SECRET`.
8. Redeploy after the webhook secret is added.

## What `db:seed` Creates

The seed step inserts:

- the admin account
- the default service catalog
- the default add-ons
- the next 14 days of service windows

## Default Admin Login

- email: `admin@archmontcleaners.local`
- password: `admin123`

Change this in `prisma/seed.mjs` before production use.

## Notes

- The app no longer depends on `NEXT_PUBLIC_APP_URL` for Stripe redirects. It derives the base URL from the incoming request, which works for Vercel preview and production deployments.
- Do not rely on runtime seeding in production. Always run `db:push` and `db:seed` explicitly against the target database.
