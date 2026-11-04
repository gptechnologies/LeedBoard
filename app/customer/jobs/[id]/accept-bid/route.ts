import { randomBytes } from "node:crypto";
import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";
import { arrivalInstant } from "@/lib/lead-policy";
import { queueMail, processMailQueue } from "@/lib/mail-queue";
export async function POST(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser(r, "CUSTOMER");
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  try {
    const f = await r.formData();
    const bidId = String(f.get("bidId") ?? "");
    const version = String(f.get("bidVersion") ?? "");
    const address = String(f.get("addressLine1") ?? "").trim();
    const city = String(f.get("city") ?? "").trim();
    const state = String(f.get("state") ?? "").trim();
    const firstName = String(f.get("firstName") ?? "").trim();
    if (
      address.length < 4 ||
      address.length > 250 ||
      city.length < 2 ||
      city.length > 100 ||
      state.length < 2 ||
      state.length > 50 ||
      !firstName ||
      firstName.length > 80
    )
      throw new Error(
        "Enter your first name, street address, city, and state.",
      );
    await prisma.$transaction(async (tx) => {
      const j = await tx.jobRequest.findFirst({
        where: { id, customerId: user.id },
        include: { bids: true },
      });
      if (!j) throw new Error("Job not found.");
      if (j.status === "AWARDED" && j.acceptedBidId === bidId) return;
      const b = j.bids.find((b) => b.id === bidId && b.status === "SUBMITTED");
      if (
        !b ||
        j.status !== "OPEN" ||
        !j.acceptanceDeadline ||
        j.acceptanceDeadline <= new Date()
      )
        throw new Error("This bid is no longer available.");
      if (!version || b.updatedAt.toISOString() !== version)
        throw new Error(
          "This bid has changed. Close this sheet and review the latest price and time.",
        );
      if (
        !b.flatRateCents ||
        b.pricingType !== "FLAT" ||
        (b.offerType && b.offerType !== "FIXED_PRICE") ||
        !b.arrivalDate ||
        !b.arrivalWindowStart
      )
        throw new Error(
          "Ask the cleaner for a total price and arrival time first.",
        );
      if (
        arrivalInstant(
          b.arrivalDate.toISOString().slice(0, 10),
          b.arrivalWindowStart,
          j.timezone,
        ) <= new Date()
      )
        throw new Error(
          "That arrival time has passed. Ask for updated availability.",
        );
      const locked = await tx.jobRequest.updateMany({
        where: {
          id,
          status: "OPEN",
          acceptedBidId: null,
          acceptanceDeadline: { gt: new Date() },
        },
        data: {
          status: "AWARDED",
          acceptedBidId: bidId,
          acceptedAt: new Date(),
          addressLine1: address,
          city,
          state,
        },
      });
      if (!locked.count) throw new Error("A cleaner was already selected.");
      const claimed = await tx.jobBid.updateMany({
        where: { id: bidId, status: "SUBMITTED", updatedAt: b.updatedAt },
        data: { status: "ACCEPTED" },
      });
      if (!claimed.count) throw new Error("This bid changed. Review it again.");
      await tx.user.update({ where: { id: user.id }, data: { firstName } });
      await tx.jobBid.updateMany({
        where: { jobRequestId: id, id: { not: bidId }, status: "SUBMITTED" },
        data: { status: "DECLINED" },
      });
      await tx.introduction.create({
        data: {
          jobId: id,
          bidId,
          token: randomBytes(32).toString("base64url"),
        },
      });
      await queueMail("intro:" + id, "INTRO", { jobId: id }, tx);
    });
    after(processMailQueue);
    return NextResponse.json({ bidId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to select cleaner" },
      { status: 400 },
    );
  }
}
