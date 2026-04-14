import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          Archmont Cleaners
        </Link>
        <nav className="nav-links">
          {!user ? (
            <>
              <Link href="/signup?role=CUSTOMER" className="primary">
                Book a Cleaning
              </Link>
              <Link href="/login">Sign In</Link>
              <Link href="/signup?role=CLEANER" className="quiet-link">
                Provider access
              </Link>
            </>
          ) : (
            <>
              {user.role === UserRole.CUSTOMER ? (
                <>
                  <Link href="/customer" className="primary">
                    My Home
                  </Link>
                  <Link href="/customer/book">Book a Cleaning</Link>
                </>
              ) : null}
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
              <form action="/auth/logout" method="post">
                <button type="submit">Sign Out</button>
              </form>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
