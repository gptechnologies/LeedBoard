import { BidStatus, JobRequestStatus, UserRole } from "@prisma/client";
import { RoleSwipeShell } from "@/components/marketplace/role-swipe-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { expireDueJobs } from "@/lib/job-lifecycle";
import "./provider.css";

export default async function CleanerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(UserRole.CLEANER);
  await expireDueJobs();
  const unreadActivityCount = await prisma.jobBid.count({
    where: {
      AND: [
        { OR: [{ cleanerId: user.id }, { cleanerLead: { linkedCleanerUserId: user.id } }] },
        { OR: [{ status: BidStatus.ACCEPTED }, { messages: { some: { sender: "CUSTOMER" } } }, { jobRequest: { status: { in: [JobRequestStatus.EXPIRED, JobRequestStatus.DELETED] } } }] },
      ],
      cleanerViewedAt: null,
    },
  });

  return (
    <RoleSwipeShell initialUnreadActivityCount={unreadActivityCount} role="cleaner">
      {children}
    </RoleSwipeShell>
  );
}
