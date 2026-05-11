import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AccountUserButton } from "@/components/account-user-button";
import { SignOutButton } from "@/components/sign-out-button";
import { CleanerDefaultsForm } from "@/components/marketplace/cleaner-defaults-form";

import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CleanerAccountPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CleanerAccountPage({ searchParams }: CleanerAccountPageProps) {
  const user = await requireUser(UserRole.CLEANER);
  const params = await searchParams;

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Account</div>
            <h1>Manage your cleaner profile.</h1>
          </div>
        </header>

        {params.error ? <div className="notice error">{params.error}</div> : null}

        <section className="market-card">
          <div className="market-card__header">
            <div className="stack small">
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <span className="market-card__meta">{user.email}</span>
            </div>
            <AccountUserButton
              email={user.email}
              firstName={user.firstName}
              lastName={user.lastName}
              role={user.role}
            />
          </div>
          <p className="market-card__copy">
            Keep your account access, availability, and bidding defaults current.
          </p>
          <div className="market-card__actions market-card__actions--start">
            <form action="/cleaner/availability" method="post">
              <input
                type="hidden"
                name="isAvailable"
                value={user.cleanerProfile?.isAvailable ? "false" : "true"}
              />
              <button type="submit" className="secondary-submit">
                {user.cleanerProfile?.isAvailable ? "Pause availability" : "Mark available"}
              </button>
            </form>
            <Link href="/cleaner/bids" className="button-link secondary">
              View bids
            </Link>
            <SignOutButton />
          </div>
        </section>

        <CleanerDefaultsForm
          defaults={{
            standardHourlyRateCents: user.cleanerProfile?.standardHourlyRateCents ?? null,
            standardFlatRateCents: user.cleanerProfile?.standardFlatRateCents ?? null,
            standardDeepCleanFlatRateCents:
              user.cleanerProfile?.standardDeepCleanFlatRateCents ?? null,
            defaultEtaMinutes: user.cleanerProfile?.defaultEtaMinutes ?? null,
          }}
        />
      </section>
    </div>
  );
}
