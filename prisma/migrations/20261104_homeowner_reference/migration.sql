-- AlterTable
ALTER TABLE "JobRequest" ADD COLUMN     "homeFactsSnapshot" JSONB,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1;
