import { CleanLevel, EntryMethod, RoomType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

const wholeHomeRooms = [
  RoomType.KITCHEN,
  RoomType.BATHROOM,
  RoomType.BEDROOM,
  RoomType.LIVING_AREA,
  RoomType.DINING_ROOM,
  RoomType.ENTRYWAY,
];

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid number.`);
  }

  return parsed;
}

function optionalPositiveInteger(value: unknown, label: string) {
  const parsed = optionalNumber(value, label);

  if (parsed === null) return null;
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a whole number greater than 0.`);
  }

  return parsed;
}

function parseBoolean(value: unknown) {
  return value === true || value === "true";
}

function parseEntryMethod(value: unknown) {
  if (typeof value === "string" && Object.values(EntryMethod).includes(value as EntryMethod)) {
    return value as EntryMethod;
  }

  return EntryMethod.I_WILL_BE_HOME;
}

function wholeHomeCleanLevels() {
  return Object.fromEntries(wholeHomeRooms.map((room) => [room, CleanLevel.MEDIUM]));
}

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const homeProfileId = optionalString(body.homeProfileId);
    const input = {
      label: optionalString(body.label) ?? "Home",
      bedroomCount: optionalNumber(body.bedroomCount, "Bedrooms"),
      bathroomCount: optionalNumber(body.bathroomCount, "Bathrooms"),
      estimatedSquareFeet: optionalPositiveInteger(body.estimatedSquareFeet, "Square footage"),
      storyCount: optionalPositiveInteger(body.storyCount, "Stories"),
      hasPets: parseBoolean(body.hasPets),
      addressLine1: requiredString(body.addressLine1, "Street address"),
      addressLine2: optionalString(body.addressLine2),
      city: requiredString(body.city, "City"),
      state: requiredString(body.state, "State"),
      postalCode: requiredString(body.postalCode, "ZIP code"),
      entryMethod: parseEntryMethod(body.entryMethod),
      entryNotes: optionalString(body.entryNotes),
      defaultRoomTypes: wholeHomeRooms,
      defaultCleanLevel: CleanLevel.MEDIUM,
      roomCleanLevels: wholeHomeCleanLevels(),
    };

    if (homeProfileId) {
      const existing = await prisma.homeProfile.findFirst({
        where: {
          id: homeProfileId,
          customerId: user.id,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "That home preset could not be found." },
          { status: 404 },
        );
      }

      const homeProfile = await prisma.homeProfile.update({
        where: { id: existing.id },
        data: {
          ...input,
          isDefault: existing.isDefault,
        },
      });

      return NextResponse.json({ homeProfile });
    }

    const existingCount = await prisma.homeProfile.count({
      where: { customerId: user.id },
    });
    const homeProfile = await prisma.homeProfile.create({
      data: {
        ...input,
        customerId: user.id,
        isDefault: existingCount === 0,
      },
    });

    return NextResponse.json({ homeProfile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save this location.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
