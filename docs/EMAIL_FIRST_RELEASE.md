# Email-first marketplace release

The current product is homeowner email/code authentication → ZIP, beds/baths and timing → private bid comparison → explicit direct introduction. Cleaners can subscribe and respond without an app account. New offers require a total price and a future arrival time. Existing hourly/estimate records remain readable.

## Production configuration

- `DATABASE_URL` and `DIRECT_DATABASE_URL`: existing PostgreSQL database.
- `RESEND_API_KEY` and `EMAIL_FROM`: verified sending domain; needed for production sign-in codes and all emails.
- `APP_BASE_URL` or `NEXT_PUBLIC_APP_URL`: canonical public HTTPS URL.
- `INBOUND_EMAIL_DOMAIN`: dedicated receiving subdomain, with Resend receiving DNS records. Do not redirect your main business mailbox's MX records.
- `RESEND_WEBHOOK_SECRET`: signing secret for `/api/webhooks/resend`. Subscribe to `email.received`, `email.delivered`, `email.bounced`, and `email.failed`.
- `CRON_SECRET`: protects `/api/cron/mail` and `/api/cron/expire-jobs`.
- The one-minute recovery cron in `vercel.json` requires a Vercel plan that supports that frequency. Request-triggered `after()` processing starts immediately; the cron recovers retries and abandoned work.

The local checkout does not contain Resend sending/receiving or cron credentials. Production values must be configured in Vercel; never commit them. Without receiving configured, lead emails offer the no-login form without promising email replies.

## Database deployment

Run `npx prisma migrate deploy`. The additive `20261104_email_first` migration preserves existing rows and unmodeled legacy database columns. EMAIL is added with `IF NOT EXISTS` because the deployed database already had that enum value. Do not use `db push` to reconcile production drift: it would propose dropping unrelated historical columns.

## Delivery and operations

Jobs and MATCH tasks commit together. MATCH creates deduplicated recipient outreach and LEAD tasks. Workers claim tasks, recover stale claims, retry failures with backoff, and expose terminal failures at `/admin/outreach`. Providers explicitly confirm subscriptions; admin enrollment sends the same confirmation request and does not manufacture consent. Paused and unsubscribed leads are excluded.

Incoming mail is signature-checked against the raw body, stored before acknowledgement, and processed through the outbox. Explicit totals with full date/time or common weekday/relative-day formats are accepted. Incomplete, conditional and ambiguous replies get a clarification/form link and appear in the operations review list. Questions are separate from selectable bids.

Preselection homeowner answers are held for admin privacy review. `/admin/outreach` allows an operator to edit and approve the answer without personal information. Pending messages are absent from cleaner message APIs and inboxes. Owners see that replies are reviewed. This intentionally requires operational coverage until a safe automated disclosure policy is introduced.

## Privacy boundary

Public invite pages select only job facts and the provider's offer. They do not load homeowner contact data or expose addresses after acceptance. Selecting a bid creates a separate private introduction capability and sends it to the chosen cleaner. Cancellation revokes that page. Emails or information already delivered cannot be recalled. Subscription management tokens are excluded from homeowner client props.

## Verification

- `npm run test:conversation`: existing tests plus ZIP, calendar/timezone/DST, email-reply parsing and identifying-text checks.
- `npx tsc --noEmit`.
- `npx next build --webpack` (the sandboxed Turbopack build stalled; Webpack completed).
- Temporary QA identities verified no-profile posting, idempotent retries, no-account offers, stale-bid rejection, private introduction isolation and cancellation revocation. No real recipients were emailed.
- Playwright inspected enrollment and posting at desktop/390px phone widths. The short form uses a paper surface with accessible text contrast and a sticky primary action.

The 10-second posting goal still needs representative human usability trials. Production email round trips require configured production credentials and DNS.
