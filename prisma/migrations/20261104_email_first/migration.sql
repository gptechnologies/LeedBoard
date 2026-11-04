-- AlterEnum
ALTER TYPE "OutreachChannel" ADD VALUE IF NOT EXISTS 'EMAIL';

-- AlterTable
ALTER TABLE "JobRequest" ADD COLUMN     "bathroomCount" DOUBLE PRECISION,
ADD COLUMN     "bedroomCount" INTEGER,
ADD COLUMN     "postingKey" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
ALTER COLUMN "addressLine1" SET DEFAULT '';

-- AlterTable
ALTER TABLE "CleanerLead" ADD COLUMN     "emailConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "normalizedEmail" TEXT,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionToken" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MailTask" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundEmail" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Introduction" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Introduction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MailTask_key_key" ON "MailTask"("key");

-- CreateIndex
CREATE INDEX "MailTask_status_availableAt_idx" ON "MailTask"("status", "availableAt");

-- CreateIndex
CREATE UNIQUE INDEX "Introduction_jobId_key" ON "Introduction"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Introduction_bidId_key" ON "Introduction"("bidId");

-- CreateIndex
CREATE UNIQUE INDEX "Introduction_token_key" ON "Introduction"("token");

-- CreateIndex
CREATE UNIQUE INDEX "JobRequest_postingKey_key" ON "JobRequest"("postingKey");

-- CreateIndex
CREATE UNIQUE INDEX "CleanerLead_normalizedEmail_key" ON "CleanerLead"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "CleanerLead_subscriptionToken_key" ON "CleanerLead"("subscriptionToken");
