import { UserRole } from "@prisma/client";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
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
    <div className="wk-app-screen wk-secondary-app-screen">
      <AppScreenHeader brandHref="/customer" />
      <div className="wk-screen-content">
        <header className="wk-homeowner-detail-heading">
          <Link href="/customer/account"><ChevronLeft aria-hidden="true" />Back to account</Link>
          <div>
            <h1>Your homes</h1>
            <p>Save addresses and access details for faster job posts.</p>
          </div>
        </header>

        {params.error ? <div className="notice error">{params.error}</div> : null}

        <HomePresetsManager homeProfiles={homeProfiles} />
      </div>
    </div>
  );
}
