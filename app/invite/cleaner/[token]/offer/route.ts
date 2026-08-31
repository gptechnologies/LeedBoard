import {
  BidPricingType,
  BidStatus,
  JobOutreachStatus,
  JobRequestStatus,
  OfferSource,
  OfferType,
  OutreachEventType,
  TimingPreference,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { notifyHomeownerOfBid } from "@/lib/marketplace-notifications";
import { isOutreachExpired } from "@/lib/outreach";
import { prisma } from "@/lib/prisma";
import { getProviderName } from "@/lib/providers";

type Params = Promise<{ token: string }>;

function redirectToForm(request: Request, token: string, error?: string) {
  const suffix = error ? `?error=${encodeURIComponent(error)}` : "?submitted=1";
  return NextResponse.redirect(new URL(`/invite/cleaner/${token}${suffix}`, request.url));
}

function optionalText(value: FormDataEntryValue | null) {
  return String(value || "").trim() || null;
}

function money(value: FormDataEntryValue | null, label: string, required = false) {
  const raw = optionalText(value);
  if (!raw && !required) return null;
  const amount = Number(raw);
  if (!raw || !Number.isFinite(amount) || amount <= 0 || amount > 10000) {
    throw new Error(`${label} must be a valid amount.`);
  }
  return Math.round(amount * 100);
}

function parseOfferType(value: FormDataEntryValue | null) {
  const raw = String(value || "");
  if (!Object.values(OfferType).includes(raw as OfferType)) {
    throw new Error("Choose an offer type.");
  }
  return raw as OfferType;
}

function parseDate(value: FormDataEntryValue | null, label: string) {
  const raw = optionalText(value);
  if (!raw) throw new Error(`${label} is required.`);
  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is invalid.`);
  return date;
}

function addHour(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const end = (hours * 60 + minutes + 60) % (24 * 60);
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { token } = await params;

  try {
    const formData = await request.formData();
    const outreach = await prisma.jobOutreach.findUnique({
      where: { interestToken: token },
      include: {
        cleanerLead: true,
        cleanerUser: { include: { cleanerProfile: true } },
        jobRequest: {
          include: {
            customer: true,
            homeProfile: { select: { propertyType: true } },
          },
        },
      },
    });

    if (!outreach || isOutreachExpired(outreach)) {
      throw new Error("This offer link has expired.");
    }
    if (outreach.jobRequest.status !== JobRequestStatus.OPEN) {
      throw new Error("This job is no longer accepting offers.");
    }
    if (!outreach.cleanerLeadId && !outreach.cleanerUserId) {
      throw new Error("This provider link is incomplete.");
    }

    const offerType = parseOfferType(formData.get("offerType"));
    const requestedScheduleAccepted = formData.get("requestedScheduleAccepted") === "true";
    const message = optionalText(formData.get("message"));
    const providerQuestion = optionalText(formData.get("providerQuestion"));
    const flatRateCents =
      offerType === OfferType.FIXED_PRICE ? money(formData.get("price"), "Price", true) : null;
    const hourlyRateCents =
      offerType === OfferType.HOURLY
        ? money(formData.get("hourlyRate"), "Hourly rate", true)
        : null;
    const priceMinCents =
      offerType === OfferType.ESTIMATE
        ? money(formData.get("priceMin"), "Estimate", true)
        : null;
    const priceMaxCents =
      offerType === OfferType.ESTIMATE
        ? money(formData.get("priceMax"), "Maximum estimate")
        : null;

    if (priceMinCents && priceMaxCents && priceMaxCents < priceMinCents) {
      throw new Error("The maximum estimate must be greater than the starting estimate.");
    }
    if (offerType === OfferType.NEEDS_DETAILS && !providerQuestion) {
      throw new Error("Add the question you need answered.");
    }

    const needsCustomTime =
      !requestedScheduleAccepted || outreach.jobRequest.timingPreference === TimingPreference.ASAP;
    const arrivalDate = needsCustomTime
      ? parseDate(formData.get("availableDate"), "Available date")
      : outreach.jobRequest.requestedDate;
    const arrivalWindowStart = needsCustomTime
      ? optionalText(formData.get("arrivalTime"))
      : outreach.jobRequest.requestedWindowStart;
    if (needsCustomTime && !arrivalWindowStart) throw new Error("Arrival time is required.");
    const arrivalWindowEnd = needsCustomTime && arrivalWindowStart
      ? addHour(arrivalWindowStart)
      : outreach.jobRequest.requestedWindowEnd;
    const estimatedHoursRaw = optionalText(formData.get("estimatedHours"));
    const estimatedHours = estimatedHoursRaw ? Number(estimatedHoursRaw) : null;
    if (estimatedHours !== null && (!Number.isFinite(estimatedHours) || estimatedHours <= 0)) {
      throw new Error("Estimated hours must be valid.");
    }

    const bid = await prisma.$transaction(async (tx) => {
      const data = {
        offerType,
        source: OfferSource.PROVIDER_FORM,
        pricingType:
          offerType === OfferType.HOURLY ? BidPricingType.HOURLY : BidPricingType.FLAT,
        flatRateCents,
        hourlyRateCents,
        priceMinCents,
        priceMaxCents,
        estimatedHours,
        requestedScheduleAccepted,
        arrivalDate,
        arrivalWindowStart,
        arrivalWindowEnd,
        providerQuestion,
        message,
        status: BidStatus.SUBMITTED,
        customerViewedAt: null,
        submittedAt: new Date(),
      };

      const savedBid = outreach.cleanerLeadId
        ? await tx.jobBid.upsert({
            where: {
              jobRequestId_cleanerLeadId: {
                jobRequestId: outreach.jobRequestId,
                cleanerLeadId: outreach.cleanerLeadId,
              },
            },
            update: data,
            create: {
              ...data,
              jobRequestId: outreach.jobRequestId,
              cleanerLeadId: outreach.cleanerLeadId,
              cleanerId: outreach.cleanerUserId,
            },
          })
        : await tx.jobBid.upsert({
            where: {
              jobRequestId_cleanerId: {
                jobRequestId: outreach.jobRequestId,
                cleanerId: outreach.cleanerUserId!,
              },
            },
            update: data,
            create: {
              ...data,
              jobRequestId: outreach.jobRequestId,
              cleanerId: outreach.cleanerUserId!,
            },
          });

      await tx.jobOutreach.update({
        where: { id: outreach.id },
        data: { bidId: savedBid.id, status: JobOutreachStatus.BID_SUBMITTED },
      });
      await tx.outreachEvent.create({
        data: {
          jobOutreachId: outreach.id,
          eventType: OutreachEventType.BID_SUBMITTED,
          payload: { bidId: savedBid.id, source: OfferSource.PROVIDER_FORM },
        },
      });
      return savedBid;
    });

    await notifyHomeownerOfBid({
      bid,
      providerName: getProviderName(outreach),
      job: outreach.jobRequest,
    });

    return redirectToForm(request, token);
  } catch (error) {
    return redirectToForm(
      request,
      token,
      error instanceof Error ? error.message : "Unable to submit this offer.",
    );
  }
}
