import { UserRole } from "@prisma/client";
import { HomeProfileForm } from "@/components/marketplace/home-profile-form";
import { buildHomeProfileFormDefaults, getDefaultHomeProfile } from "@/lib/marketplace";
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
  const homeProfile = await getDefaultHomeProfile(user.id);

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">My Home</div>
            <h1>Save your default cleaning setup.</h1>
          </div>
        </header>

        {params.error ? <div className="notice error">{params.error}</div> : null}

        <HomeProfileForm defaults={buildHomeProfileFormDefaults(homeProfile)} />
      </section>
    </div>
  );
}
