import { UserRole } from "@prisma/client";
import { HomeProfileForm } from "@/components/marketplace/home-profile-form";
import {
  buildHomeProfileFormDefaults,
  formatRoomTypes,
  getCustomerHomeProfiles,
  getEntryMethodLabel,
} from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CustomerMyHomePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CustomerMyHomePage({
  searchParams,
}: CustomerMyHomePageProps) {
  const user = await requireUser(UserRole.CUSTOMER);
  const params = await searchParams;
  const homeProfiles = await getCustomerHomeProfiles(user.id);

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Home presets</div>
            <h1>Save homes for faster job posts.</h1>
          </div>
        </header>

        {params.error ? <div className="notice error">{params.error}</div> : null}

        <section className="stack">
          <div className="market-section-heading">
            <h2>Saved homes ({homeProfiles.length})</h2>
          </div>
          {homeProfiles.length > 0 ? (
            <div className="market-home-preset-list">
              {homeProfiles.map((home) => (
                <article key={home.id} className="market-card market-home-preset-card">
                  <div className="stack small">
                    <strong>{home.label}</strong>
                    <span className="market-card__meta">
                      {home.addressLine1}, {home.city}, {home.state} {home.postalCode}
                    </span>
                    <span className="market-card__meta">
                      {home.defaultRoomTypes.length > 0
                        ? formatRoomTypes(home.defaultRoomTypes)
                        : "No typical rooms saved"} · {getEntryMethodLabel(home.entryMethod)}
                    </span>
                  </div>
                  <form action={`/customer/my-home/${home.id}/delete`} method="post">
                    <button type="submit" className="secondary-submit">
                      Delete
                    </button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <section className="market-empty">
              <strong>No home presets saved yet.</strong>
              <p className="market-card__copy">
                Add a nickname, address, and typical rooms so they appear when you post a job.
              </p>
            </section>
          )}
        </section>

        <section className="stack">
          <div className="market-section-heading">
            <h2>Add a home preset</h2>
          </div>
          <HomeProfileForm defaults={buildHomeProfileFormDefaults(null)} />
        </section>
      </section>
    </div>
  );
}
