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

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
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

        {params.error ? <div className="notice error">{params.error}</div> : null}

        <form action="/admin/leads/save" method="post" className="market-card stack">
          <div className="market-card__header">
            <strong>Add cleaner lead</strong>
          </div>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="businessName">Business name</label>
              <input id="businessName" name="businessName" placeholder="Bright Home Cleaning" />
            </div>
            <div className="field">
              <label htmlFor="name">Contact name</label>
              <input id="name" name="name" placeholder="Optional" />
            </div>
          </div>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" inputMode="tel" required placeholder="(555) 555-0123" />
            </div>
            <div className="field">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" inputMode="url" placeholder="https://example.com" />
            </div>
          </div>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" name="city" />
            </div>
            <div className="field">
              <label htmlFor="state">State</label>
              <input id="state" name="state" defaultValue="NY" />
            </div>
          </div>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="postalCode">Primary ZIP</label>
              <input id="postalCode" name="postalCode" inputMode="numeric" required />
            </div>
            <div className="field">
              <label htmlFor="serviceAreaPostalCodes">Service ZIPs</label>
              <input
                id="serviceAreaPostalCodes"
                name="serviceAreaPostalCodes"
                placeholder="10001, 10002, 10003"
              />
            </div>
          </div>
          <input type="hidden" name="source" value={CleanerLeadSource.MANUAL} />
          <button type="submit">Save lead</button>
        </form>

        {leads.length === 0 ? (
          <section className="market-empty">
            <strong>No leads yet.</strong>
            <p className="market-card__copy">
              Add nearby cleaners by ZIP, then new jobs will create SMS and call outreach rows.
            </p>
          </section>
        ) : (
          <div className="stack">
            {leads.map((lead) => (
              <article key={lead.id} className="market-card">
                <div className="market-card__header">
                  <div className="stack small">
                    <strong>{lead.businessName || lead.name || lead.phone}</strong>
                    <span className="market-card__meta">
                      {lead.phone} · {lead.city ? `${lead.city}, ` : ""}
                      {lead.state ?? ""} {lead.postalCode ?? ""}
                    </span>
                  </div>
                  {lead.optedOutAt ? <span className="status-pill">Opted out</span> : null}
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
