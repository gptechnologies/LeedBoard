import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.CLEANER);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  await prisma.cleanerJobPass.deleteMany({
    where: {
      cleanerId: user.id,
      jobRequestId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
