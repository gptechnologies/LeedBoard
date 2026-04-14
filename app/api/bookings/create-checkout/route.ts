import { BookingEventType, BookingStatus, PaymentStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  buildBookingNumber,
  cleanerHasConflictingBooking,
  getBookingPricingData,
  markBookingPaid,
  recordBookingEvent,
} from "@/lib/bookings";
import { getRequiredString } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

function redirectWithError(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/customer/book?error=${encodeURIComponent(message)}`, request.url),
  );
}

export async function POST(request: Request) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const formData = await request.formData();

  try {
    const serviceId = getRequiredString(formData.get("serviceId"), "Service");
    const cleanerId = getRequiredString(formData.get("cleanerId"), "Cleaner");
    const slotId = getRequiredString(formData.get("slotId"), "Time slot");
    const bedrooms = Number(getRequiredString(formData.get("bedrooms"), "Bedrooms"));
    const bathrooms = Number(getRequiredString(formData.get("bathrooms"), "Bathrooms"));
    const addOnIds = formData.getAll("addOnId").map(String);

    const [cleaner, slot, pricingData] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: cleanerId,
          role: UserRole.CLEANER,
          cleanerProfile: {
            is: {
              isAvailable: true,
            },
          },
        },
      }),
      prisma.timeSlot.findFirst({
        where: {
          id: slotId,
          isActive: true,
          startsAt: {
            gt: new Date(),
          },
        },
      }),
      getBookingPricingData({
        serviceId,
        addOnIds,
        bedrooms,
        bathrooms,
      }),
    ]);

    if (!cleaner) {
      return redirectWithError(request, "That cleaner is no longer available.");
    }

    if (!slot) {
      return redirectWithError(request, "That time slot is no longer available.");
    }

    const conflict = await cleanerHasConflictingBooking(cleaner.id, slot.id);

    if (conflict) {
      return redirectWithError(request, "That cleaner has already been booked for that slot.");
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          bookingNumber: buildBookingNumber(),
          status: BookingStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
          subtotalCents: pricingData.pricing.subtotalCents,
          addOnTotalCents: pricingData.pricing.addOnTotalCents,
          taxCents: pricingData.pricing.taxCents,
          totalCents: pricingData.pricing.totalCents,
          addressLine1: getRequiredString(formData.get("addressLine1"), "Address line 1"),
          addressLine2: String(formData.get("addressLine2") || "").trim() || null,
          city: getRequiredString(formData.get("city"), "City"),
          state: getRequiredString(formData.get("state"), "State"),
          postalCode: getRequiredString(formData.get("postalCode"), "Postal code"),
          bedrooms,
          bathrooms,
          notes: String(formData.get("notes") || "").trim() || null,
          expiresAt,
          customerId: user.id,
          cleanerId: cleaner.id,
          serviceId: pricingData.service.id,
          slotId: slot.id,
          addOns: {
            create: pricingData.addOns.map((addOn) => ({
              addOnId: addOn.id,
              quantity: 1,
              unitPriceCents: addOn.priceCents,
              totalPriceCents: addOn.priceCents,
            })),
          },
        },
      });

      await recordBookingEvent({
        bookingId: created.id,
        actorId: user.id,
        eventType: BookingEventType.BOOKING_CREATED,
        toStatus: BookingStatus.PENDING_PAYMENT,
        tx,
      });

      if (!user.phone && formData.get("phone")) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            phone: String(formData.get("phone")).trim() || null,
          },
        });
      }

      return created;
    });

    if (!isStripeConfigured()) {
      await markBookingPaid({ bookingId: booking.id });
      return NextResponse.redirect(new URL(`/checkout/success?booking=${booking.id}`, request.url));
    }

    const stripe = getStripe();
    const baseUrl = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      metadata: {
        bookingId: booking.id,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${pricingData.service.name} with ${cleaner.firstName} ${cleaner.lastName}`,
              description: `${slot.startsAt.toLocaleString()} service window`,
            },
            unit_amount: booking.totalCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/checkout/success?booking=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?booking=${booking.id}`,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripeCheckoutSessionId: session.id,
      },
    });

    if (!session.url) {
      return redirectWithError(request, "Stripe checkout could not be created.");
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong while creating the booking.";
    return redirectWithError(request, message);
  }
}
