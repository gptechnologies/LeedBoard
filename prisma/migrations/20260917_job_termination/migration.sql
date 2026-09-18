ALTER TYPE "JobRequestStatus" ADD VALUE IF NOT EXISTS 'DELETED';

ALTER TABLE "JobRequest"
  ADD COLUMN IF NOT EXISTS "acceptanceDeadline" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "JobRequest_status_acceptanceDeadline_idx"
  ON "JobRequest"("status", "acceptanceDeadline");
