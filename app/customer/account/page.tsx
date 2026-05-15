import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AccountUserButton } from "@/components/account-user-button";
import { SignOutButton } from "@/components/sign-out-button";

import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomerAccountPage() {
  const user = await requireUser(UserRole.CUSTOMER);

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">My Account</div>
            <h1>Manage your WellKept account.</h1>
          </div>
        </header>

        <section className="market-card">
          <div className="market-card__header">
            <div className="stack small">
              <strong>{user.firstName} {user.lastName}</strong>
              <span className="market-card__meta">{user.email || user.phone}</span>
            </div>
            <AccountUserButton
              email={user.email}
              phone={user.phone}
              firstName={user.firstName}
              lastName={user.lastName}
              role={user.role}
            />
          </div>
          <p className="market-card__copy">
            Your phone number is your sign-in method. We will text a code whenever you need access.
          </p>
          <div className="market-card__actions market-card__actions--start">
            <Link href="/customer/my-home" className="button-link secondary">
              Manage Home Presets
            </Link>
            <SignOutButton />
          </div>
        </section>
      </section>
    </div>
  );
}
