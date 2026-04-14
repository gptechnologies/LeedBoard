import { BookingEventType, BookingStatus, PaymentStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { recordBookingEvent } from "@/lib/bookings";

type CancelRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: CancelRouteProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.CUSTOMER) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { id } = await params;
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      customerId: user.id,
    },
    include: {
      slot: true,
    },
  });

  if (!booking) {
    return NextResponse.redirect(new URL("/customer", request.url));
  }

  if (
    booking.status === BookingStatus.CANCELLED ||
    booking.status === BookingStatus.COMPLETED ||
    new Date(booking.slot.startsAt) <= new Date()
  ) {
    return NextResponse.redirect(new URL(`/customer/bookings/${booking.id}`, request.url));
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus:
          booking.paymentStatus === PaymentStatus.PAID
            ? PaymentStatus.PAID
            : PaymentStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    await recordBookingEvent({
      bookingId: booking.id,
      actorId: user.id,
      eventType: BookingEventType.STATUS_CHANGED,
      fromStatus: booking.status,
      toStatus: BookingStatus.CANCELLED,
      note: "Cancelled by customer.",
      tx,
    });
  });

  return NextResponse.redirect(new URL(`/customer/bookings/${booking.id}`, request.url));
}

