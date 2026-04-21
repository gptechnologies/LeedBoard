import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { AccountUserButton } from "@/components/account-user-button";
import { getCurrentUser } from "@/lib/session";

export async function SiteHeader() {
  const [{ userId }, user] = await Promise.all([auth(), getCurrentUser()]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          WellKept
        </Link>
        <nav className="nav-links">
          {!userId ? (
            <>
              <Link href="/signup?role=CUSTOMER" className="primary">
                Find a Cleaner
              </Link>
              <Link href="/login">Sign In</Link>
              <Link href="/signup?role=CLEANER" className="quiet-link">
                Cleaner access
              </Link>
            </>
          ) : user?.role === UserRole.CUSTOMER ? null : user ? (
            <>
              {user.role === UserRole.CLEANER ? (
                <Link href="/cleaner" className="primary">
                  My Schedule
                </Link>
              ) : null}
              {user.role === UserRole.ADMIN ? (
                <Link href="/admin" className="primary">
                  Operations
                </Link>
              ) : null}
              <AccountUserButton />
            </>
          ) : (
            <>
              <Link href="/welcome" className="primary">
                Finish setup
              </Link>
              <AccountUserButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
