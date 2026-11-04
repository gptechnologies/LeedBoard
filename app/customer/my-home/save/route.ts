import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseHomeProfileForm } from "@/lib/marketplace-form";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

function redirectWithError(request: Request, message: string) {
  if (request.headers.get("X-Well-Kept-Client") === "1")
    return NextResponse.json({ error: message }, { status: 400 });
  return NextResponse.redirect(
    new URL(
      `/customer/account?error=${encodeURIComponent(message)}`,
      request.url,
    ),
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
    if (
      input.bedroomCount !== null &&
      (!Number.isInteger(input.bedroomCount) || input.bedroomCount > 20)
    )
      throw new Error("Choose a bedroom count from 0 to 20.");
    if (
      input.bathroomCount !== null &&
      (input.bathroomCount < 0.5 ||
        input.bathroomCount > 20 ||
        (input.bathroomCount * 2) % 1)
    )
      throw new Error("Choose bathrooms in half steps, from 0.5 to 20.");
    if (
      (input.notes?.length ?? 0) > 1000 ||
      (input.entryNotes?.length ?? 0) > 1000
    )
      throw new Error("Keep notes under 1,000 characters.");
    const homeProfileId = String(formData.get("homeProfileId") || "").trim();

    if (homeProfileId) {
      const existing = await prisma.homeProfile.findFirst({
        where: {
          id: homeProfileId,
          customerId: user.id,
        },
      });

      if (!existing) {
        return redirectWithError(
          request,
          "That home preset could not be found.",
        );
      }

      const homeProfile = await prisma.homeProfile.update({
        where: { id: existing.id },
        data: {
          ...input,
          isDefault: existing.isDefault,
          storyCount: formData.has("storyCount")
            ? input.storyCount
            : existing.storyCount,
        },
      });

      if (request.headers.get("X-Well-Kept-Client") === "1")
        return NextResponse.json({ homeProfile });
      return NextResponse.redirect(
        new URL("/customer/account?saved=1", request.url),
        303,
      );
    }

    const existingCount = await prisma.homeProfile.count({
      where: { customerId: user.id },
    });
    const homeProfile = await prisma.homeProfile.create({
      data: {
        ...input,
        isDefault: existingCount === 0,
        customerId: user.id,
      },
    });

    if (request.headers.get("X-Well-Kept-Client") === "1")
      return NextResponse.json({ homeProfile });
    return NextResponse.redirect(
      new URL("/customer/account?saved=1", request.url),
      303,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to save your home preset right now.";
    return redirectWithError(request, message);
  }
}
