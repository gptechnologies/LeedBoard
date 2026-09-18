# Job lifecycle rollout

The job conversation refresh adds `JobRequest.acceptanceDeadline`, `JobRequest.deletedAt`, and the `DELETED` status. Apply the additive Prisma migration to the target database **before** deploying code that reads these fields:

```sh
npx prisma migrate deploy
```

The existing production database was baselined as `0_baseline` on 2026-09-18, then `20260917_job_termination` was applied. The baseline records its live schema, including legacy columns no longer modeled in `schema.prisma`; it does not drop them. On a new database, `migrate deploy` creates that baseline schema before applying the additive migration. Review any future generated migrations for legacy-column drops before applying them.

Set `CRON_SECRET` in Vercel to a random value of at least 16 characters. The configured daily cron reconciles expired jobs even without site traffic; requests and live feed refreshes also reconcile deadlines when users are active. The cron endpoint rejects requests without the matching bearer token.

New jobs accept bids for 48 hours from posting, capped at the requested arrival time. Existing open jobs receive the same computed deadline on their first reconciliation. Expiration preserves bids and messages, closes the conversation, notifies the homeowner and bidders, and allows a new prefilled posting rather than reopening the old job.
