import { EntryMethod, UserRole } from "@prisma/client";
import { Mail, Phone } from "lucide-react";

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
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
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
          <span className="wk-wordmark">Well Kept<span aria-hidden="true">✦</span></span>
          <p>A cleaner home, happier you</p>
        </div>
        <span aria-hidden="true" className="wk-account-initials">{initials}</span>
      </header>

      <div className="wk-screen-content wk-account-content">
        <section className="wk-account-identity" aria-labelledby="account-address-heading">
          <h1 id="account-address-heading">{home.addressLine1 || "Your home"}</h1>
          <p>{home.city ? `${home.city}, ${home.state} ${home.postalCode}` : "Add your address and home details below"}</p>
          <div className="wk-account-contact-list">
            <span><Mail aria-hidden="true" />{user.email || "Email not added"}</span>
            <span><Phone aria-hidden="true" />{user.phone ? formatPhone(user.phone) : "Phone not added"}</span>
          </div>
        </section>

        {query.saved === "1" ? <p className="wk-account-notice is-success" role="status">Home details saved.</p> : null}
        {query.error ? <p className="wk-account-notice is-error" role="alert">{query.error}</p> : null}

        <HomeownerAccountForm home={home} />
      </div>
    </div>
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return value;
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}
