import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push";
import { requireApiUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CLEANER);
  if (user instanceof NextResponse) {
    return user;
  }

  const result = await sendPushNotification({
    userId: user.id,
    payload: {
      title: "Well Kept job alerts are on",
      body: "Test notification received. New jobs will open directly to the bid screen.",
      url: "/cleaner",
    },
  });

  return NextResponse.json(result);
}
