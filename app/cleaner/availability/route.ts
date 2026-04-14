import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CLEANER);
  if (user instanceof NextResponse) {
    return user;
  }

  const formData = await request.formData();
  const isAvailable = String(formData.get("isAvailable")) === "true";

  await prisma.cleanerProfile.upsert({
    where: { userId: user.id },
    update: { isAvailable },
    create: {
      userId: user.id,
      isAvailable,
    },
  });

  return NextResponse.redirect(new URL("/cleaner", request.url));
}
