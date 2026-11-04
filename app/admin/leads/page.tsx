import { CleanerLeadSource, UserRole } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type AdminLeadsPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLeadsPage({
  searchParams,
}: AdminLeadsPageProps) {
  await requireUser(UserRole.ADMIN);
  const params = await searchParams;
  const leads = await prisma.cleanerLead.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
  });

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Admin</div>
            <h1>Cleaner Leads</h1>
          </div>
          <Link href="/admin/outreach" className="button-link secondary">
            Outreach
          </Link>
        </header>

        {params.error ? (
          <div className="notice error">{params.error}</div>
        ) : null}

        <form
          action="/admin/leads/save"
          method="post"
          className="effortless-form"
        >
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <label>
            Business name or website
            <input name="business" required />
          </label>
          <label>
            Service ZIP
            <input name="postalCode" pattern="[0-9]{5}" required />
          </label>
          <label>
            Additional ZIPs
            <input name="extraZips" />
          </label>
          <p>
            We’ll send an email confirmation. Leads start after the business
            confirms.
          </p>
          <button className="effortless-primary">Add business</button>
        </form>

        {leads.length === 0 ? (
          <section className="market-empty">
            <strong>No leads yet.</strong>
            <p className="market-card__copy">
              Add nearby cleaners by ZIP, then new jobs will create SMS and call
              outreach rows.
            </p>
          </section>
        ) : (
          <div className="stack">
            {leads.map((lead) => (
              <article key={lead.id} className="market-card">
                <div className="market-card__header">
                  <div className="stack small">
                    <strong>
                      {lead.businessName || lead.name || lead.phone}
                    </strong>
                    <span className="market-card__meta">
                      {lead.phone}
                      {lead.email ? ` · ${lead.email}` : ""} ·{" "}
                      {lead.city ? `${lead.city}, ` : ""}
                      {lead.state ?? ""} {lead.postalCode ?? ""}
                    </span>
                  </div>
                  {lead.optedOutAt ? (
                    <span className="status-pill">Opted out</span>
                  ) : null}
                </div>
                <div className="market-card__copy">
                  Service ZIPs:{" "}
                  {lead.serviceAreaPostalCodes.length > 0
                    ? lead.serviceAreaPostalCodes.join(", ")
                    : lead.postalCode}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
