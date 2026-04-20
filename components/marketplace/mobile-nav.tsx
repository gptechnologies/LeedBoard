"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const customerNav = [
  { href: "/customer", label: "Home" },
  { href: "/customer/my-home", label: "My Home" },
  { href: "/customer/jobs/new", label: "Post Job" },
];

const cleanerNav = [
  { href: "/cleaner", label: "Open Jobs" },
  { href: "/cleaner/bids", label: "My Bids" },
];

export function MobileNav({ role }: { role: "customer" | "cleaner" }) {
  const pathname = usePathname();
  const items = role === "customer" ? customerNav : cleanerNav;

  return (
    <nav className="market-mobile-nav">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "market-mobile-nav__link active" : "market-mobile-nav__link"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
