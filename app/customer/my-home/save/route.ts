import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseHomeProfileForm } from "@/lib/marketplace-form";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/customer/my-home?error=${encodeURIComponent(message)}`, request.url),
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
    const existing = await prisma.homeProfile.findFirst({
      where: {
        customerId: user.id,
        isDefault: true,
      },
    });

    if (existing) {
      await prisma.homeProfile.update({
        where: { id: existing.id },
        data: input,
      });
    } else {
      await prisma.homeProfile.create({
        data: {
          ...input,
          customerId: user.id,
        },
      });
    }

    return NextResponse.redirect(new URL("/customer", request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save your home preset right now.";
    return redirectWithError(request, message);
  }
}
