import { PropertyType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getRequiredString } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/onboarding/homeowner?error=${encodeURIComponent(message)}`, request.url),
  );
}

function optionalString(value: FormDataEntryValue | null) {
  const trimmed = String(value || "").trim();
  return trimmed || null;
}

function normalizeHeardAboutUs(
  value: FormDataEntryValue | null,
  otherValue: FormDataEntryValue | null,
) {
  const selected = String(value || "").trim();
  const other = optionalString(otherValue);

  if (selected === "Other") {
    return other ?? "Other";
  }

  return selected || null;
}

function parsePropertyType(value: FormDataEntryValue | null) {
  const propertyType = getRequiredString(value, "Property type");

  if (!Object.values(PropertyType).includes(propertyType as PropertyType)) {
    throw new Error("Choose house or apartment.");
  }

  return propertyType as PropertyType;
}

function parseOptionalNumber(value: FormDataEntryValue | null, label: string) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid number.`);
  }
  return parsed;
}

function parseOptionalPositiveInteger(value: FormDataEntryValue | null, label: string) {
  const parsed = parseOptionalNumber(value, label);
  if (parsed === null) return null;
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a whole number greater than 0.`);
  }
  return parsed;
}

function parseBoolean(value: FormDataEntryValue | null, label: string) {
  const raw = getRequiredString(value, label);

  if (raw === "true") return true;
  if (raw === "false") return false;

  throw new Error(`${label} must be yes or no.`);
}

function parsePostalCode(value: FormDataEntryValue | null) {
  const postalCode = getRequiredString(value, "ZIP code");
  if (!/^\d{5}(?:-\d{4})?$/.test(postalCode)) {
    throw new Error("Enter a valid ZIP code.");
  }
  return postalCode;
}

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const formData = await request.formData();

  try {
    const addressInput = {
      label: "Home",
      propertyType: parsePropertyType(formData.get("propertyType")),
      bedroomCount: parseOptionalNumber(formData.get("bedroomCount"), "Bedrooms"),
      bathroomCount: parseOptionalNumber(formData.get("bathroomCount"), "Bathrooms"),
      estimatedSquareFeet: parseOptionalPositiveInteger(formData.get("estimatedSquareFeet"), "Square footage"),
      storyCount: parseOptionalPositiveInteger(formData.get("storyCount"), "Stories"),
      hasPets: parseBoolean(formData.get("hasPets"), "Pets"),
      addressLine1: getRequiredString(formData.get("addressLine1"), "Street address"),
      addressLine2: optionalString(formData.get("addressLine2")),
      city: getRequiredString(formData.get("city"), "City"),
      state: getRequiredString(formData.get("state"), "State"),
      postalCode: parsePostalCode(formData.get("postalCode")),
      googlePlaceId: optionalString(formData.get("googlePlaceId")),
    };
    const pushChoice = String(formData.get("pushChoice") || "").trim();
    const notificationPermission = String(formData.get("notificationPermission") || "").trim();
    const pushNotificationsEnabled =
      pushChoice === "enabled" && notificationPermission === "granted";
    const pushNotificationsRequestedAt =
      pushChoice === "enabled" || pushChoice === "skipped" ? new Date() : null;
    const heardAboutUs = normalizeHeardAboutUs(
      formData.get("heardAboutUs"),
      formData.get("heardAboutUsOther"),
    );

    const existingDefaultHome = await prisma.homeProfile.findFirst({
      where: {
        customerId: user.id,
        isDefault: true,
      },
      select: {
        id: true,
      },
    });

    if (existingDefaultHome) {
      await prisma.homeProfile.update({
        where: { id: existingDefaultHome.id },
        data: addressInput,
      });
    } else {
      await prisma.homeProfile.create({
        data: {
          ...addressInput,
          customerId: user.id,
          isDefault: true,
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        homeownerOnboardingCompletedAt: new Date(),
        pushNotificationsRequestedAt,
        pushNotificationsEnabled,
        heardAboutUs,
      },
    });

    return NextResponse.redirect(new URL("/customer", request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "We couldn't finish homeowner setup.";
    return redirectWithError(request, message);
  }
}
