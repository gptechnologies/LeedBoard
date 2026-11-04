import { HomeownerShell } from "@/components/marketplace/homeowner-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { expireDueJobs } from "@/lib/job-lifecycle";
import { unreadBid } from "@/lib/homeowner-view";
import "./reference-homeowner.css";
export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("CUSTOMER");
  await expireDueJobs();
  const bids = await prisma.jobBid.findMany({
    where: {
      customerViewedAt: null,
      jobRequest: { customerId: user.id, status: { not: "DELETED" } },
    },
    select: {
      id: true,
      customerViewedAt: true,
      status: true,
      messages: {
        select: { sender: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  return (
    <HomeownerShell
      unreadIds={bids.filter(unreadBid).map((b) => b.id)}
      ownerId={user.id}
    >
      {children}
    </HomeownerShell>
  );
}
