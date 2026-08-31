import { CleanerLeadSource, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getRequiredString } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone, requireApiUser } from "@/lib/session";

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/admin/leads?error=${encodeURIComponent(message)}`, request.url),
  );
}

function optionalString(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  return raw || null;
}

function parseZipList(value: FormDataEntryValue | null, fallback: string) {
  const zips = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set([fallback, ...zips]));
}

function parseSource(value: FormDataEntryValue | null) {
  const source = String(value || "").trim();
  if (Object.values(CleanerLeadSource).includes(source as CleanerLeadSource)) {
    return source as CleanerLeadSource;
  }

  return CleanerLeadSource.MANUAL;
}

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.ADMIN);
  if (user instanceof NextResponse) {
    return user;
  }

  const formData = await request.formData();

  try {
    const phone = normalizePhone(getRequiredString(formData.get("phone"), "Phone"));
    const postalCode = getRequiredString(formData.get("postalCode"), "Primary ZIP");
    const input = {
      name: optionalString(formData.get("name")),
      businessName: optionalString(formData.get("businessName")),
      phone,
      email: optionalString(formData.get("email")),
      website: optionalString(formData.get("website")),
      source: parseSource(formData.get("source")),
      city: optionalString(formData.get("city")),
      state: optionalString(formData.get("state")),
      postalCode,
      serviceAreaPostalCodes: parseZipList(formData.get("serviceAreaPostalCodes"), postalCode),
      consentedAt: new Date(),
    };

    await prisma.cleanerLead.upsert({
      where: { phone },
      update: input,
      create: input,
    });

    return NextResponse.redirect(new URL("/admin/leads", request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save cleaner lead.";
    return redirectWithError(request, message);
  }
}
