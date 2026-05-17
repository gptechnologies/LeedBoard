import { BidStatus, ThreadMessageKind, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { getRequiredString } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{
  bidId: string;
}>;

function redirectToThread(request: Request, bidId: string, error?: string) {
  const url = new URL(`/customer/messages/${bidId}`, request.url);
  if (error) {
    url.searchParams.set("error", error);
  }
  return NextResponse.redirect(url);
}

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const { bidId } = await params;

  try {
    const formData = await request.formData();
    const message = getRequiredString(formData.get("message"), "Message");

    if (message.length > 500) {
      throw new Error("Keep messages under 500 characters.");
    }

    const bid = await prisma.jobBid.findFirst({
      where: {
        id: bidId,
        status: BidStatus.ACCEPTED,
        jobRequest: {
          customerId: user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!bid) {
      throw new Error("This conversation is not available.");
    }

    const thread = await prisma.messageThread.upsert({
      where: {
        jobBidId: bid.id,
      },
      update: {},
      create: {
        jobBidId: bid.id,
        createdById: user.id,
      },
      select: {
        id: true,
      },
    });

    await prisma.threadMessage.create({
      data: {
        threadId: thread.id,
        senderId: user.id,
        kind: ThreadMessageKind.USER,
        body: message,
      },
    });

    return redirectToThread(request, bidId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send that message.";
    return redirectToThread(request, bidId, message);
  }
}
