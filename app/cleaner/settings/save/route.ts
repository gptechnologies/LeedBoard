import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

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
    await prisma.cleanerProfile.upsert({
      where: { userId: user.id },
      update: {
        standardHourlyRateCents: toCents(formData.get("standardHourlyRate")),
        standardFlatRateCents: toCents(formData.get("standardFlatRate")),
        standardDeepCleanFlatRateCents: toCents(formData.get("standardDeepCleanFlatRate")),
        defaultEtaMinutes: Number(String(formData.get("defaultEtaMinutes") || "").trim() || "0") || null,
      },
      create: {
        userId: user.id,
        isAvailable: true,
        serviceAreaPostalCodes: [],
        serviceNeeds: [],
        standardHourlyRateCents: toCents(formData.get("standardHourlyRate")),
        standardFlatRateCents: toCents(formData.get("standardFlatRate")),
        standardDeepCleanFlatRateCents: toCents(formData.get("standardDeepCleanFlatRate")),
        defaultEtaMinutes: Number(String(formData.get("defaultEtaMinutes") || "").trim() || "0") || null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save your bid defaults right now.";
    return NextResponse.redirect(new URL(`/cleaner?error=${encodeURIComponent(message)}`, request.url));
  }

  return NextResponse.redirect(new URL("/cleaner", request.url));
}
