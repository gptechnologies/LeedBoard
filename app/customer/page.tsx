import { JobRequestStatus, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function CustomerDashboard() {
  const user = await requireUser(UserRole.CUSTOMER);
  const activeJob = await prisma.jobRequest.findFirst({
    where: {
      customerId: user.id,
      status: { in: [JobRequestStatus.OPEN, JobRequestStatus.AWARDED] },
    },
    select: { id: true },
  });

  redirect(activeJob ? "/customer/jobs" : "/customer/jobs/new");
}
