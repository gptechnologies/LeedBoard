import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{ bidId: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const payload = (await request.json().catch(() => null)) as { role?: string } | null;
  const role = payload?.role === "cleaner" ? UserRole.CLEANER : UserRole.CUSTOMER;
  const user = await requireApiUser(request, role);

  if (user instanceof NextResponse) return user;

  const { bidId } = await params;
  const result = await prisma.jobBid.updateMany({
    where:
      role === UserRole.CUSTOMER
        ? { id: bidId, jobRequest: { customerId: user.id } }
        : { id: bidId, cleanerId: user.id },
    data:
      role === UserRole.CUSTOMER
        ? { customerViewedAt: new Date() }
        : { cleanerViewedAt: new Date() },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Activity item not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
