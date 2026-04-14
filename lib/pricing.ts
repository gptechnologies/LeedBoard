import type { AddOn, Service } from "@prisma/client";

const TAX_RATE = 0.08;

export function calculateBookingPrice(input: {
  service: Service;
  addOns: AddOn[];
  bedrooms: number;
  bathrooms: number;
}) {
  const bedroomAdjustment = Math.max(0, input.bedrooms - 1) * 1500;
  const bathroomAdjustment = Math.max(0, Math.ceil(input.bathrooms - 1)) * 1000;
  const addOnTotalCents = input.addOns.reduce((sum, addOn) => sum + addOn.priceCents, 0);
  const subtotalCents =
    input.service.basePriceCents + bedroomAdjustment + bathroomAdjustment;
  const taxCents = Math.round((subtotalCents + addOnTotalCents) * TAX_RATE);
  const totalCents = subtotalCents + addOnTotalCents + taxCents;

  return {
    subtotalCents,
    addOnTotalCents,
    taxCents,
    totalCents,
  };
}

