import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type PushUnsubscribeBody = {
  endpoint?: string;
};

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CLEANER);
  if (user instanceof NextResponse) {
    return user;
  }

  const body = (await request.json().catch(() => ({}))) as PushUnsubscribeBody;
  const endpoint = body.endpoint?.trim();

  await prisma.$transaction(async (tx) => {
    if (endpoint) {
      await tx.pushSubscription.updateMany({
        where: {
          endpoint,
          userId: user.id,
        },
        data: {
          disabledAt: new Date(),
        },
      });
    } else {
      await tx.pushSubscription.updateMany({
        where: {
          userId: user.id,
          disabledAt: null,
        },
        data: {
          disabledAt: new Date(),
        },
      });
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        pushNotificationsEnabled: false,
        pushNotificationsRequestedAt: new Date(),
      },
    });
  });

  return NextResponse.json({ ok: true });
}
