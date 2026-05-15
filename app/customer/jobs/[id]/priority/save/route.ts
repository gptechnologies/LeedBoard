import { BidSelectionPriority, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{
  id: string;
}>;

function parseSelectionPriority(value: FormDataEntryValue | null) {
  const priority = String(value || "").trim();

  if (Object.values(BidSelectionPriority).includes(priority as BidSelectionPriority)) {
    return priority as BidSelectionPriority;
  }

  return BidSelectionPriority.BEST_OVERALL;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const formData = await request.formData();
  const selectionPriority = parseSelectionPriority(formData.get("selectionPriority"));

  await prisma.jobRequest.updateMany({
    where: {
      id,
      customerId: user.id,
    },
    data: {
      selectionPriority,
    },
  });

  return NextResponse.redirect(new URL(`/customer/jobs/${id}`, request.url));
}
