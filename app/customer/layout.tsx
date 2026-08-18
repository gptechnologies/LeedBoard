import { UserRole } from "@prisma/client";
import { RoleSwipeShell } from "@/components/marketplace/role-swipe-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import "./homeowner.css";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(UserRole.CUSTOMER);

  const unreadActivityCount = await prisma.jobBid.count({
    where: {
      customerViewedAt: null,
      jobRequest: { customerId: user.id },
    },
  });

  return (
    <RoleSwipeShell initialUnreadActivityCount={unreadActivityCount} role="customer">
      {children}
    </RoleSwipeShell>
  );
}
