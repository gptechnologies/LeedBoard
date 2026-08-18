import { BidStatus, UserRole } from "@prisma/client";
import { RoleSwipeShell } from "@/components/marketplace/role-swipe-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import "./provider.css";

export default async function CleanerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(UserRole.CLEANER);
  const unreadActivityCount = await prisma.jobBid.count({
    where: {
      cleanerId: user.id,
      cleanerViewedAt: null,
      status: BidStatus.ACCEPTED,
    },
  });

  return (
    <RoleSwipeShell initialUnreadActivityCount={unreadActivityCount} role="cleaner">
      {children}
    </RoleSwipeShell>
  );
}
