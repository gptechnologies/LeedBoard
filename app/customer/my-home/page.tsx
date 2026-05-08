import { UserRole } from "@prisma/client";
import { HomePresetsManager } from "@/components/marketplace/home-presets-manager";
import { getCustomerHomeProfiles } from "@/lib/marketplace";
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

        <HomePresetsManager homeProfiles={homeProfiles} />
      </section>
    </div>
  );
}
