import { UserRole } from "@prisma/client";
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

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const formData = await request.formData();

  try {
    const addressInput = {
      label: "Home",
      addressLine1: getRequiredString(formData.get("addressLine1"), "Street address"),
      addressLine2: optionalString(formData.get("addressLine2")),
      city: getRequiredString(formData.get("city"), "City"),
      state: getRequiredString(formData.get("state"), "State"),
      postalCode: getRequiredString(formData.get("postalCode"), "ZIP code"),
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
