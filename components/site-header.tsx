import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AccountUserButton } from "@/components/account-user-button";
import { getCurrentUser, needsAccountSetup } from "@/lib/session";

export async function SiteHeader() {
  const user = await getCurrentUser();

  const brandHref = user
    ? user.role === UserRole.CUSTOMER
      ? "/customer"
      : user.role === UserRole.CLEANER
        ? "/cleaner"
        : "/"
    : "/";

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href={brandHref} className="brand">
          <span>Well Kept</span>
          <small>Bring trusted cleaners to you.</small>
        </Link>
        <nav className="nav-links">
          {!user ? (
            <Link href="/login">Sign In</Link>
          ) : needsAccountSetup(user) ? (
            <Link href={`/welcome?role=${user.role}`} className="primary">
              Finish setup
            </Link>
          ) : (
            <AccountUserButton
              email={user.email}
              firstName={user.firstName}
              phone={user.phone}
              lastName={user.lastName}
              role={user.role}
            />
          )}
        </nav>
      </div>
    </header>
  );
}
