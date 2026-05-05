"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const customerNav = [
  { href: "/customer", label: "Home", icon: "home" },
  { href: "/customer/jobs", label: "Jobs", icon: "jobs" },
  { href: "/customer/messages", label: "Messages", icon: "messages" },
  { href: "/customer/account", label: "Account", icon: "account" },
];

const cleanerNav = [
  { href: "/cleaner", label: "Jobs", icon: "jobs" },
  { href: "/cleaner/bids", label: "Bids", icon: "post" },
];

export function MobileNav({ role }: { role: "customer" | "cleaner" }) {
  const pathname = usePathname();
  const items = role === "customer" ? customerNav : cleanerNav;

  return (
    <nav className="market-mobile-nav">
      {items.map((item) => {
        const active =
          item.href === "/customer" || item.href === "/cleaner"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "market-mobile-nav__link active" : "market-mobile-nav__link"}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ name }: { name: string }) {
  if (name === "jobs") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
        <path d="M5 7h14v12H5z" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  if (name === "messages") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }

  if (name === "post") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
        <path d="M4 4h16v16H4z" />
      </svg>
    );
  }

  if (name === "account") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m4 11 8-7 8 7" />
      <path d="M6.5 10.5V20h11v-9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}
