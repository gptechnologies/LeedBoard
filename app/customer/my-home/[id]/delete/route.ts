import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{
  id: string;
}>;

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const home = await prisma.homeProfile.findFirst({
    where: {
      id,
      customerId: user.id,
    },
  });

  if (!home) {
    return NextResponse.redirect(new URL("/customer/my-home", request.url));
  }

  await prisma.homeProfile.delete({
    where: { id: home.id },
  });

  if (home.isDefault) {
    const nextHome = await prisma.homeProfile.findFirst({
      where: { customerId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (nextHome) {
      await prisma.homeProfile.update({
        where: { id: nextHome.id },
        data: { isDefault: true },
      });
    }
  }

  return NextResponse.redirect(new URL("/customer/my-home", request.url));
}
