import { BookingEventType, BookingStatus, PaymentStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { canCleanerMoveToStatus, recordBookingEvent } from "@/lib/bookings";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type CleanerStatusRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: CleanerStatusRouteProps) {
  const user = await requireApiUser(request, UserRole.CLEANER);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const formData = await request.formData();
  const requestedStatus = String(formData.get("status"));

  if (!Object.values(BookingStatus).includes(requestedStatus as BookingStatus)) {
    return NextResponse.redirect(new URL(`/cleaner/bookings/${id}`, request.url));
  }

  const nextStatus = requestedStatus as BookingStatus;
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      cleanerId: user.id,
      paymentStatus: PaymentStatus.PAID,
    },
  });

  if (!booking) {
    return NextResponse.redirect(new URL("/cleaner", request.url));
  }

  if (!canCleanerMoveToStatus(booking.status, nextStatus)) {
    return NextResponse.redirect(new URL(`/cleaner/bookings/${id}`, request.url));
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: nextStatus,
        completedAt: nextStatus === BookingStatus.COMPLETED ? new Date() : null,
      },
    });

    await recordBookingEvent({
      bookingId: booking.id,
      actorId: user.id,
      eventType: BookingEventType.STATUS_CHANGED,
      fromStatus: booking.status,
      toStatus: nextStatus,
      tx,
    });
  });

  return NextResponse.redirect(new URL(`/cleaner/bookings/${booking.id}`, request.url));
}
