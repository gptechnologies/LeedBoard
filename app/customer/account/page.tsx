import { EntryMethod, UserRole } from "@prisma/client";
import Link from "next/link";

import { AppNavigationMenu } from "@/components/marketplace/app-navigation-menu";
import { HomeownerAccountForm } from "@/components/marketplace/homeowner-account-form";
import { getCustomerHomeData } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CustomerAccountPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function CustomerAccountPage({ searchParams }: CustomerAccountPageProps) {
  const user = await requireUser(UserRole.CUSTOMER);
  const query = await searchParams;
  const { homeProfile } = await getCustomerHomeData(user.id);
  const home = {
    id: homeProfile?.id ?? null,
    label: homeProfile?.label ?? "My Home",
    addressLine1: homeProfile?.addressLine1 ?? "",
    addressLine2: homeProfile?.addressLine2 ?? "",
    city: homeProfile?.city ?? "",
    state: homeProfile?.state ?? "New York",
    postalCode: homeProfile?.postalCode ?? "",
    bedroomCount: homeProfile?.bedroomCount ?? null,
    bathroomCount: homeProfile?.bathroomCount ?? null,
    estimatedSquareFeet: homeProfile?.estimatedSquareFeet ?? null,
    storyCount: homeProfile?.storyCount ?? null,
    hasPets: homeProfile?.hasPets ?? false,
    entryMethod: homeProfile?.entryMethod ?? EntryMethod.I_WILL_BE_HOME,
    entryNotes: homeProfile?.entryNotes ?? "",
    notes: homeProfile?.notes ?? "",
  };

  return (
    <div className="wk-app-screen wk-account-screen">
      <header className="wk-account-header">
        <div className="wk-account-brand">
          <Link className="wk-wordmark" href="/customer">Well Kept<span aria-hidden="true">✦</span></Link>
          <p>Keep your place well kept</p>
        </div>
        <AppNavigationMenu />
      </header>

      <main className="wk-screen-content wk-account-content">
        {query.saved === "1" ? <p className="wk-account-notice is-success" role="status">Home details saved.</p> : null}
        {query.error ? <p className="wk-account-notice is-error" role="alert">{query.error}</p> : null}

        <HomeownerAccountForm home={home} phone={user.phone} startEditing={Boolean(query.error)} />
      </main>
    </div>
  );
}
