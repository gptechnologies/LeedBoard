import { UserRole } from "@prisma/client";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser(UserRole.ADMIN);
  const query = await searchParams;
  const providers = await prisma.cleanerProfile.findMany({
    include: { user: true },
    orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
  });
  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div><div className="market-kicker">Admin</div><h1>Provider approvals</h1></div>
          <Link href="/admin/attention" className="button-link secondary">Jobs needing help</Link>
        </header>
        {query.error ? <div className="notice error" role="alert">{query.error}</div> : null}
        {providers.length === 0 ? <section className="market-empty"><strong>No provider profiles yet.</strong></section> : (
          <div className="stack">
            {providers.map((provider) => (
              <article className="market-card" key={provider.id}>
                <div className="market-card__header">
                  <div className="stack small">
                    <strong>{provider.businessName || `${provider.user.firstName} ${provider.user.lastName}`}</strong>
                    <span className="market-card__meta">{provider.user.email}{provider.user.phone ? ` · ${provider.user.phone}` : ""}</span>
                    <span className="market-card__meta">ZIPs: {provider.serviceAreaPostalCodes.join(", ") || "Not configured"}</span>
                  </div>
                  <span className="status-pill">{provider.approvalStatus}</span>
                </div>
                <div className="market-card__actions market-card__actions--start">
                  <form action={`/admin/providers/${provider.id}/status`} method="post"><input name="status" type="hidden" value="APPROVED" /><button className="secondary-submit" type="submit">Approve</button></form>
                  <form action={`/admin/providers/${provider.id}/status`} method="post"><input name="status" type="hidden" value="PAUSED" /><button className="secondary-submit" type="submit">Pause</button></form>
                  <form action={`/admin/providers/${provider.id}/status`} method="post"><input name="status" type="hidden" value="BLOCKED" /><button className="secondary-submit" type="submit">Block</button></form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
