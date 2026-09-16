import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseHomeProfileForm } from "@/lib/marketplace-form";
import { prisma } from "@/lib/prisma";
import { normalizePhone, requireApiUser } from "@/lib/session";

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/customer/account?error=${encodeURIComponent(message)}`, request.url),
    303,
  );
}

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const formData = await request.formData();

  try {
    const input = parseHomeProfileForm(formData);
    const homeProfileId = String(formData.get("homeProfileId") || "").trim();
    const phoneValue = String(formData.get("phone") || "").trim();
    const phone = phoneValue ? normalizePhone(phoneValue) : null;

    if (phone !== user.phone) {
      await prisma.user.update({ where: { id: user.id }, data: { phone } });
    }

    if (homeProfileId) {
      const existing = await prisma.homeProfile.findFirst({
        where: {
          id: homeProfileId,
          customerId: user.id,
        },
      });

      if (!existing) {
        return redirectWithError(request, "That home preset could not be found.");
      }

      await prisma.homeProfile.update({
        where: { id: existing.id },
        data: {
          ...input,
          isDefault: existing.isDefault,
        },
      });

      return NextResponse.redirect(new URL("/customer/account?saved=1", request.url), 303);
    }

    const existingCount = await prisma.homeProfile.count({
      where: { customerId: user.id },
    });
    await prisma.homeProfile.create({
      data: {
        ...input,
        isDefault: existingCount === 0,
        customerId: user.id,
      },
    });

    return NextResponse.redirect(new URL("/customer/account?saved=1", request.url), 303);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save your home preset right now.";
    return redirectWithError(request, message);
  }
}
