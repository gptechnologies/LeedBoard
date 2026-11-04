import { HomeownerHeader } from "@/components/marketplace/homeowner-shell";
import { HomeownerAccountForm } from "@/components/marketplace/homeowner-account-form";
import { getDefaultHomeProfile } from "@/lib/marketplace";
import { requireUser } from "@/lib/session";
export const dynamic = "force-dynamic";
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await requireUser("CUSTOMER");
  const [home, p] = await Promise.all([
    getDefaultHomeProfile(user.id),
    searchParams,
  ]);
  const details = {
    id: home?.id ?? null,
    label: home?.label ?? "My home",
    addressLine1: home?.addressLine1 ?? "",
    addressLine2: home?.addressLine2 ?? null,
    city: home?.city ?? "",
    state: home?.state ?? "NY",
    postalCode: home?.postalCode ?? "",
    bedroomCount: home?.bedroomCount ?? null,
    bathroomCount: home?.bathroomCount ?? null,
    estimatedSquareFeet: home?.estimatedSquareFeet ?? null,
    hasPets: home?.hasPets ?? false,
    entryMethod: home?.entryMethod ?? "I_WILL_BE_HOME",
    entryNotes: home?.entryNotes ?? null,
    notes: home?.notes ?? null,
  };
  return (
    <>
      <HomeownerHeader />
      <section className="hk-page hk-account">
        <header className="hk-heading">
          <h1>
            {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
              "Your account"}
          </h1>
          <p>{user.email}</p>
        </header>
        <HomeownerAccountForm home={details} startEditing={p.edit === "home"} />
      </section>
    </>
  );
}
