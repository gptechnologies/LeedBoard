import { ProviderApprovalStatus, ServiceNeed, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone, requireApiUser } from "@/lib/session";

function toCents(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Enter valid default bid amounts.");
  }

  return Math.round(parsed * 100);
}

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CLEANER);
  if (user instanceof NextResponse) {
    return user;
  }

  const formData = await request.formData();

  try {
    const phoneValue = String(formData.get("phone") || "").trim();
    if (!phoneValue) throw new Error("Add a mobile number for confirmed homeowner connections.");
    const phone = normalizePhone(phoneValue);
    const serviceAreaPostalCodes = Array.from(new Set(
      String(formData.get("serviceAreaPostalCodes") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ));
    if (serviceAreaPostalCodes.some((value) => !/^\d{5}$/.test(value))) {
      throw new Error("Enter service ZIPs as five-digit codes separated by commas.");
    }
    if (serviceAreaPostalCodes.length === 0) {
      throw new Error("Add at least one service ZIP.");
    }
    const defaultServiceNeeds = [
      ServiceNeed.GENERAL_CLEANING,
      ServiceNeed.KITCHEN,
      ServiceNeed.BATHROOMS,
      ServiceNeed.FLOORS,
      ServiceNeed.DUSTING,
      ServiceNeed.DEEP_CLEAN,
      ServiceNeed.MOVE_OUT,
    ];
    await prisma.user.update({ where: { id: user.id }, data: { phone } });
    await prisma.cleanerProfile.upsert({
      where: { userId: user.id },
      update: {
        standardHourlyRateCents: toCents(formData.get("standardHourlyRate")),
        standardFlatRateCents: toCents(formData.get("standardFlatRate")),
        standardDeepCleanFlatRateCents: toCents(formData.get("standardDeepCleanFlatRate")),
        defaultEtaMinutes: Number(String(formData.get("defaultEtaMinutes") || "").trim() || "0") || null,
        serviceAreaPostalCodes,
        serviceNeeds: user.cleanerProfile?.serviceNeeds.length ? user.cleanerProfile.serviceNeeds : defaultServiceNeeds,
      },
      create: {
        userId: user.id,
        approvalStatus: ProviderApprovalStatus.PENDING,
        isAvailable: true,
        serviceAreaPostalCodes,
        serviceNeeds: defaultServiceNeeds,
        standardHourlyRateCents: toCents(formData.get("standardHourlyRate")),
        standardFlatRateCents: toCents(formData.get("standardFlatRate")),
        standardDeepCleanFlatRateCents: toCents(formData.get("standardDeepCleanFlatRate")),
        defaultEtaMinutes: Number(String(formData.get("defaultEtaMinutes") || "").trim() || "0") || null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save your bid defaults right now.";
    return NextResponse.redirect(
      new URL(`/cleaner/account?error=${encodeURIComponent(message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL("/cleaner/account", request.url));
}
