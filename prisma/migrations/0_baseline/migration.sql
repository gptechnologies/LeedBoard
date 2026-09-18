-- Baseline captured from the existing production database on 2026-09-18.
-- Mark as applied on that database; this SQL is for initializing fresh databases.
-- Existing legacy columns are preserved intentionally, not removed by this rollout.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."BidPricingType" AS ENUM ('HOURLY', 'FLAT');

-- CreateEnum
CREATE TYPE "public"."BidSelectionPriority" AS ENUM ('CHEAPEST', 'FASTEST', 'BEST_QUALITY', 'BEST_OVERALL');

-- CreateEnum
CREATE TYPE "public"."BidStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "public"."BookingEventType" AS ENUM ('BOOKING_CREATED', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING_PAYMENT', 'BOOKED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CleanLevel" AS ENUM ('LIGHT', 'MEDIUM', 'DEEP');

-- CreateEnum
CREATE TYPE "public"."CleanerLeadSource" AS ENUM ('MANUAL', 'GOOGLE_PLACES', 'WEBSITE', 'REFERRAL');

-- CreateEnum
CREATE TYPE "public"."ConversationChannel" AS ENUM ('APP', 'SMS');

-- CreateEnum
CREATE TYPE "public"."ConversationCloseReason" AS ENUM ('ACCEPTED', 'NOT_SELECTED', 'JOB_CANCELLED', 'JOB_EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ConversationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ConversationSender" AS ENUM ('CUSTOMER', 'CLEANER');

-- CreateEnum
CREATE TYPE "public"."EntryMethod" AS ENUM ('HIDDEN_KEY', 'DOOR_CODE', 'BUZZ_IN', 'I_WILL_BE_HOME', 'FRONT_DESK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."HomeCondition" AS ENUM ('LIGHT_TOUCH_UP', 'NORMAL_LIVED_IN', 'NEEDS_EXTRA_ATTENTION');

-- CreateEnum
CREATE TYPE "public"."JobCleanType" AS ENUM ('STANDARD_CLEAN', 'DEEP_CLEAN', 'MOVE_OUT_CLEAN', 'RECURRING_CLEAN', 'ASAP_REFRESH');

-- CreateEnum
CREATE TYPE "public"."JobOutreachStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'INTERESTED', 'NOT_INTERESTED', 'INVITE_SENT', 'ONBOARDED', 'BID_SUBMITTED', 'FAILED', 'OPTED_OUT');

-- CreateEnum
CREATE TYPE "public"."JobPriorityArea" AS ENUM ('KITCHEN', 'BATHROOMS', 'FLOORS', 'PET_HAIR', 'INSIDE_FRIDGE', 'INSIDE_OVEN');

-- CreateEnum
CREATE TYPE "public"."JobRequestStatus" AS ENUM ('OPEN', 'AWARDED', 'CANCELLED', 'EXPIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('SMS', 'PUSH', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'OPTED_OUT', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."OfferSource" AS ENUM ('PROVIDER_FORM', 'SMS', 'CLEANER_APP', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."OfferType" AS ENUM ('FIXED_PRICE', 'ESTIMATE', 'FREE_QUOTE', 'HOURLY', 'NEEDS_DETAILS');

-- CreateEnum
CREATE TYPE "public"."OutreachChannel" AS ENUM ('APP', 'SMS', 'VAPI_CALL', 'MANUAL_CALL', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."OutreachEventType" AS ENUM ('CREATED', 'SENT', 'DELIVERED', 'INTERESTED', 'NOT_INTERESTED', 'INVITE_SENT', 'ONBOARDED', 'BID_SUBMITTED', 'FAILED', 'OPTED_OUT', 'NOTE_ADDED');

-- CreateEnum
CREATE TYPE "public"."OutreachState" AS ENUM ('PENDING', 'IN_PROGRESS', 'CONTACTED', 'NEEDS_ATTENTION', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PriorityType" AS ENUM ('GENERAL_DUST', 'DEEP_BATHROOM', 'DEEP_KITCHEN', 'FLOORS', 'MOVE_OUT_TOUCHES', 'WINDOWS', 'ORGANIZING');

-- CreateEnum
CREATE TYPE "public"."PropertyType" AS ENUM ('HOUSE', 'APARTMENT');

-- CreateEnum
CREATE TYPE "public"."ProviderApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'PAUSED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."RoomType" AS ENUM ('KITCHEN', 'BATHROOM', 'BEDROOM', 'LIVING_AREA', 'OFFICE', 'LAUNDRY', 'DINING_ROOM', 'ENTRYWAY');

-- CreateEnum
CREATE TYPE "public"."ServiceNeed" AS ENUM ('GENERAL_CLEANING', 'DEEP_CLEAN', 'KITCHEN', 'BATHROOMS', 'FLOORS', 'DUSTING', 'MOVE_OUT', 'WINDOWS', 'LAUNDRY');

-- CreateEnum
CREATE TYPE "public"."SuppliesSource" AS ENUM ('CLEANER_BRINGS_ALL', 'HOMEOWNER_PROVIDES', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."TimingPreference" AS ENUM ('ASAP', 'TIME_SLOT');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('CUSTOMER', 'CLEANER', 'ADMIN');

-- CreateTable
CREATE TABLE "public"."AddOn" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "status" "public"."BookingStatus" NOT NULL,
    "paymentStatus" "public"."PaymentStatus" NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "addOnTotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingAddOn" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "totalPriceCents" INTEGER NOT NULL,
    "bookingId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,

    CONSTRAINT "BookingAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingEvent" (
    "id" TEXT NOT NULL,
    "eventType" "public"."BookingEventType" NOT NULL,
    "fromStatus" "public"."BookingStatus",
    "toStatus" "public"."BookingStatus",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT NOT NULL,
    "actorId" TEXT,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanerJobPass" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "jobRequestId" TEXT NOT NULL,
    "passedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanerJobPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanerLead" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "businessName" TEXT,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "source" "public"."CleanerLeadSource" NOT NULL DEFAULT 'MANUAL',
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "serviceAreaPostalCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "googleRating" DOUBLE PRECISION,
    "googleReviewCount" INTEGER,
    "optedOutAt" TIMESTAMP(3),
    "consentedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "linkedCleanerUserId" TEXT,
    "optOutReason" TEXT,
    "email" TEXT,

    CONSTRAINT "CleanerLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CleanerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatarUrl" TEXT,
    "flatRateAvailable" BOOLEAN NOT NULL DEFAULT false,
    "headline" TEXT,
    "hourlyRateFromCents" INTEGER,
    "serviceAreaPostalCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "serviceNeeds" "public"."ServiceNeed"[] DEFAULT ARRAY[]::"public"."ServiceNeed"[],
    "bidTemplatesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultEtaMinutes" INTEGER,
    "externalReviewSource" TEXT,
    "googleRating" DOUBLE PRECISION,
    "googleReviewCount" INTEGER,
    "googleReviewSummary" TEXT,
    "licensedAndInsured" BOOLEAN NOT NULL DEFAULT false,
    "standardDeepCleanFlatRateCents" INTEGER,
    "standardFlatRateCents" INTEGER,
    "standardHourlyRateCents" INTEGER,
    "businessName" TEXT,
    "website" TEXT,
    "approvalStatus" "public"."ProviderApprovalStatus" NOT NULL DEFAULT 'APPROVED',

    CONSTRAINT "CleanerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConversationMessage" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "sender" "public"."ConversationSender" NOT NULL,
    "channel" "public"."ConversationChannel" NOT NULL,
    "body" TEXT NOT NULL,
    "deliveryStatus" "public"."ConversationDeliveryStatus",
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HomeProfile" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'My Home',
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "entryMethod" "public"."EntryMethod" NOT NULL DEFAULT 'I_WILL_BE_HOME',
    "entryNotes" TEXT,
    "suppliesSource" "public"."SuppliesSource" NOT NULL DEFAULT 'CLEANER_BRINGS_ALL',
    "defaultRoomTypes" "public"."RoomType"[] DEFAULT ARRAY[]::"public"."RoomType"[],
    "defaultPriorityTypes" "public"."PriorityType"[] DEFAULT ARRAY[]::"public"."PriorityType"[],
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "defaultCleanLevel" "public"."CleanLevel" NOT NULL DEFAULT 'MEDIUM',
    "roomCleanLevels" JSONB NOT NULL DEFAULT '{}',
    "bathroomCount" DOUBLE PRECISION,
    "bedroomCount" INTEGER,
    "hasPets" BOOLEAN NOT NULL DEFAULT false,
    "propertyType" "public"."PropertyType" NOT NULL DEFAULT 'HOUSE',
    "estimatedSquareFeet" INTEGER,
    "storyCount" INTEGER,
    "googlePlaceId" TEXT,

    CONSTRAINT "HomeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobBid" (
    "id" TEXT NOT NULL,
    "pricingType" "public"."BidPricingType" NOT NULL,
    "hourlyRateCents" INTEGER,
    "flatRateCents" INTEGER,
    "arrivalDate" TIMESTAMP(3),
    "arrivalWindowStart" TEXT,
    "arrivalWindowEnd" TEXT,
    "message" TEXT,
    "status" "public"."BidStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobRequestId" TEXT NOT NULL,
    "cleanerId" TEXT,
    "etaMinutes" INTEGER,
    "estimatedHours" DOUBLE PRECISION,
    "cleanerViewedAt" TIMESTAMP(3),
    "customerViewedAt" TIMESTAMP(3),
    "cleanerLeadId" TEXT,
    "offerType" "public"."OfferType",
    "priceMaxCents" INTEGER,
    "priceMinCents" INTEGER,
    "providerQuestion" TEXT,
    "requestedScheduleAccepted" BOOLEAN,
    "source" "public"."OfferSource",
    "submittedAt" TIMESTAMP(3),
    "conversationCloseReason" "public"."ConversationCloseReason",
    "conversationClosedAt" TIMESTAMP(3),

    CONSTRAINT "JobBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobOutreach" (
    "id" TEXT NOT NULL,
    "channel" "public"."OutreachChannel" NOT NULL,
    "status" "public"."JobOutreachStatus" NOT NULL DEFAULT 'PENDING',
    "interestToken" TEXT NOT NULL,
    "interestTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastAttemptAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "providerCallId" TEXT,
    "providerMessageId" TEXT,
    "failureReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobRequestId" TEXT NOT NULL,
    "cleanerUserId" TEXT,
    "cleanerLeadId" TEXT,
    "bidId" TEXT,

    CONSTRAINT "JobOutreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "serviceNeeds" "public"."ServiceNeed"[],
    "timingPreference" "public"."TimingPreference" NOT NULL,
    "requestedDate" TIMESTAMP(3),
    "requestedWindowStart" TEXT,
    "requestedWindowEnd" TEXT,
    "notes" TEXT,
    "status" "public"."JobRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "acceptedBidId" TEXT,
    "customerCompletedJobsSnapshot" INTEGER NOT NULL DEFAULT 0,
    "customerMemberSinceSnapshot" TIMESTAMP(3),
    "entryMethod" "public"."EntryMethod" NOT NULL DEFAULT 'I_WILL_BE_HOME',
    "entryNotes" TEXT,
    "homeProfileId" TEXT,
    "priorityTypes" "public"."PriorityType"[] DEFAULT ARRAY[]::"public"."PriorityType"[],
    "roomTypes" "public"."RoomType"[] DEFAULT ARRAY[]::"public"."RoomType"[],
    "suppliesSource" "public"."SuppliesSource" NOT NULL DEFAULT 'CLEANER_BRINGS_ALL',
    "cleanLevel" "public"."CleanLevel" NOT NULL DEFAULT 'MEDIUM',
    "roomCleanLevels" JSONB NOT NULL DEFAULT '{}',
    "cleanersNotifiedCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "selectionPriority" "public"."BidSelectionPriority" NOT NULL DEFAULT 'BEST_OVERALL',
    "cleanType" "public"."JobCleanType",
    "currentCondition" "public"."HomeCondition",
    "matchingPriorityAreas" "public"."JobPriorityArea"[] DEFAULT ARRAY[]::"public"."JobPriorityArea"[],
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "publicReference" TEXT,
    "attentionReason" TEXT,
    "clientRequestId" TEXT,
    "needsAttentionAt" TIMESTAMP(3),
    "outreachAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "outreachCompletedAt" TIMESTAMP(3),
    "outreachFailureReason" TEXT,
    "outreachNextAttemptAt" TIMESTAMP(3),
    "outreachStartedAt" TIMESTAMP(3),
    "outreachState" "public"."OutreachState" NOT NULL DEFAULT 'PENDING',
    "snapshotBathroomCount" DOUBLE PRECISION,
    "snapshotBedroomCount" INTEGER,
    "snapshotEstimatedSquareFeet" INTEGER,
    "snapshotHasPets" BOOLEAN,
    "snapshotPropertyType" "public"."PropertyType",
    "snapshotStoryCount" INTEGER,

    CONSTRAINT "JobRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationDelivery" (
    "id" TEXT NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "status" "public"."NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "toPhone" TEXT,
    "providerMessageId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "jobOutreachId" TEXT,
    "jobRequestId" TEXT,
    "userId" TEXT,
    "cleanerLeadId" TEXT,
    "toEmail" TEXT,
    "dedupeKey" TEXT,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OtpChallenge" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OutreachEvent" (
    "id" TEXT NOT NULL,
    "eventType" "public"."OutreachEventType" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobOutreachId" TEXT NOT NULL,

    CONSTRAINT "OutreachEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhoneIdentity" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basePriceCents" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimeSlot" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heardAboutUs" TEXT,
    "homeownerOnboardingCompletedAt" TIMESTAMP(3),
    "pushNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushNotificationsRequestedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AddOn_slug_key" ON "public"."AddOn"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "public"."Booking"("bookingNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripeCheckoutSessionId_key" ON "public"."Booking"("stripeCheckoutSessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CleanerJobPass_cleanerId_jobRequestId_key" ON "public"."CleanerJobPass"("cleanerId" ASC, "jobRequestId" ASC);

-- CreateIndex
CREATE INDEX "CleanerJobPass_cleanerId_passedAt_idx" ON "public"."CleanerJobPass"("cleanerId" ASC, "passedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CleanerLead_phone_key" ON "public"."CleanerLead"("phone" ASC);

-- CreateIndex
CREATE INDEX "CleanerLead_postalCode_idx" ON "public"."CleanerLead"("postalCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CleanerProfile_userId_key" ON "public"."CleanerProfile"("userId" ASC);

-- CreateIndex
CREATE INDEX "ConversationMessage_bidId_createdAt_id_idx" ON "public"."ConversationMessage"("bidId" ASC, "createdAt" ASC, "id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMessage_providerMessageId_key" ON "public"."ConversationMessage"("providerMessageId" ASC);

-- CreateIndex
CREATE INDEX "JobBid_cleanerLeadId_idx" ON "public"."JobBid"("cleanerLeadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "JobBid_jobRequestId_cleanerId_key" ON "public"."JobBid"("jobRequestId" ASC, "cleanerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "JobBid_jobRequestId_cleanerLeadId_key" ON "public"."JobBid"("jobRequestId" ASC, "cleanerLeadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "JobOutreach_bidId_key" ON "public"."JobOutreach"("bidId" ASC);

-- CreateIndex
CREATE INDEX "JobOutreach_cleanerLeadId_idx" ON "public"."JobOutreach"("cleanerLeadId" ASC);

-- CreateIndex
CREATE INDEX "JobOutreach_cleanerUserId_idx" ON "public"."JobOutreach"("cleanerUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "JobOutreach_interestToken_key" ON "public"."JobOutreach"("interestToken" ASC);

-- CreateIndex
CREATE INDEX "JobOutreach_jobRequestId_status_idx" ON "public"."JobOutreach"("jobRequestId" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "JobRequest_acceptedBidId_key" ON "public"."JobRequest"("acceptedBidId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "JobRequest_customerId_clientRequestId_key" ON "public"."JobRequest"("customerId" ASC, "clientRequestId" ASC);

-- CreateIndex
CREATE INDEX "JobRequest_outreachState_outreachNextAttemptAt_idx" ON "public"."JobRequest"("outreachState" ASC, "outreachNextAttemptAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "JobRequest_publicReference_key" ON "public"."JobRequest"("publicReference" ASC);

-- CreateIndex
CREATE INDEX "NotificationDelivery_cleanerLeadId_idx" ON "public"."NotificationDelivery"("cleanerLeadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_dedupeKey_key" ON "public"."NotificationDelivery"("dedupeKey" ASC);

-- CreateIndex
CREATE INDEX "NotificationDelivery_jobOutreachId_idx" ON "public"."NotificationDelivery"("jobOutreachId" ASC);

-- CreateIndex
CREATE INDEX "NotificationDelivery_jobRequestId_idx" ON "public"."NotificationDelivery"("jobRequestId" ASC);

-- CreateIndex
CREATE INDEX "NotificationDelivery_providerMessageId_idx" ON "public"."NotificationDelivery"("providerMessageId" ASC);

-- CreateIndex
CREATE INDEX "NotificationDelivery_userId_idx" ON "public"."NotificationDelivery"("userId" ASC);

-- CreateIndex
CREATE INDEX "OtpChallenge_channel_destination_consumedAt_idx" ON "public"."OtpChallenge"("channel" ASC, "destination" ASC, "consumedAt" ASC);

-- CreateIndex
CREATE INDEX "PhoneIdentity_phone_idx" ON "public"."PhoneIdentity"("phone" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneIdentity_userId_key" ON "public"."PhoneIdentity"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "public"."PushSubscription"("endpoint" ASC);

-- CreateIndex
CREATE INDEX "PushSubscription_userId_disabledAt_idx" ON "public"."PushSubscription"("userId" ASC, "disabledAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "public"."Service"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "public"."Session"("tokenHash" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_startsAt_endsAt_key" ON "public"."TimeSlot"("startsAt" ASC, "endsAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "public"."TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingAddOn" ADD CONSTRAINT "BookingAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "public"."AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingAddOn" ADD CONSTRAINT "BookingAddOn_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingEvent" ADD CONSTRAINT "BookingEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingEvent" ADD CONSTRAINT "BookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CleanerJobPass" ADD CONSTRAINT "CleanerJobPass_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CleanerJobPass" ADD CONSTRAINT "CleanerJobPass_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "public"."JobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CleanerLead" ADD CONSTRAINT "CleanerLead_linkedCleanerUserId_fkey" FOREIGN KEY ("linkedCleanerUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CleanerProfile" ADD CONSTRAINT "CleanerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationMessage" ADD CONSTRAINT "ConversationMessage_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "public"."JobBid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HomeProfile" ADD CONSTRAINT "HomeProfile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBid" ADD CONSTRAINT "JobBid_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBid" ADD CONSTRAINT "JobBid_cleanerLeadId_fkey" FOREIGN KEY ("cleanerLeadId") REFERENCES "public"."CleanerLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBid" ADD CONSTRAINT "JobBid_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "public"."JobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobOutreach" ADD CONSTRAINT "JobOutreach_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "public"."JobBid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobOutreach" ADD CONSTRAINT "JobOutreach_cleanerLeadId_fkey" FOREIGN KEY ("cleanerLeadId") REFERENCES "public"."CleanerLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobOutreach" ADD CONSTRAINT "JobOutreach_cleanerUserId_fkey" FOREIGN KEY ("cleanerUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobOutreach" ADD CONSTRAINT "JobOutreach_jobRequestId_fkey" FOREIGN KEY ("jobRequestId") REFERENCES "public"."JobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobRequest" ADD CONSTRAINT "JobRequest_acceptedBidId_fkey" FOREIGN KEY ("acceptedBidId") REFERENCES "public"."JobBid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobRequest" ADD CONSTRAINT "JobRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobRequest" ADD CONSTRAINT "JobRequest_homeProfileId_fkey" FOREIGN KEY ("homeProfileId") REFERENCES "public"."HomeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_cleanerLeadId_fkey" FOREIGN KEY ("cleanerLeadId") REFERENCES "public"."CleanerLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_jobOutreachId_fkey" FOREIGN KEY ("jobOutreachId") REFERENCES "public"."JobOutreach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutreachEvent" ADD CONSTRAINT "OutreachEvent_jobOutreachId_fkey" FOREIGN KEY ("jobOutreachId") REFERENCES "public"."JobOutreach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhoneIdentity" ADD CONSTRAINT "PhoneIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
