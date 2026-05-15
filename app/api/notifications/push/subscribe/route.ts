import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type PushSubscriptionBody = {
  endpoint?: string;
  keys?: {
    auth?: string;
    p256dh?: string;
  };
};

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CLEANER);
  if (user instanceof NextResponse) {
    return user;
  }

  const body = (await request.json()) as PushSubscriptionBody;
  const endpoint = body.endpoint?.trim();
  const auth = body.keys?.auth?.trim();
  const p256dh = body.keys?.p256dh?.trim();

  if (!endpoint || !auth || !p256dh) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.pushSubscription.upsert({
      where: { endpoint },
      update: {
        auth,
        disabledAt: null,
        p256dh,
        userAgent: request.headers.get("user-agent"),
        userId: user.id,
      },
      create: {
        auth,
        endpoint,
        p256dh,
        userAgent: request.headers.get("user-agent"),
        userId: user.id,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        pushNotificationsEnabled: true,
        pushNotificationsRequestedAt: new Date(),
      },
    });
  });

  return NextResponse.json({ ok: true });
}
