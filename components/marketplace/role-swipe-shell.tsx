"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Home, MessageCircle, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { triggerHaptic } from "@/lib/haptics";

type AppRole = "customer" | "cleaner";

const roleTabs = {
  customer: [
    { href: "/customer/account", label: "Account", Icon: UserRound },
    { href: "/customer", label: "Home", Icon: Home, primary: true },
    { href: "/customer/messages", label: "Messages", Icon: MessageCircle },
  ],
  cleaner: [
    { href: "/cleaner/account", label: "Account", Icon: UserRound },
    { href: "/cleaner", label: "Jobs", Icon: BriefcaseBusiness, primary: true },
    { href: "/cleaner/messages", label: "Messages", Icon: MessageCircle },
  ],
} as const;

export function RoleSwipeShell({
  children,
  initialUnreadActivityCount = 0,
  role,
}: {
  children: React.ReactNode;
  initialUnreadActivityCount?: number;
  role: AppRole;
}) {
  const pathname = usePathname();
  const tabs = roleTabs[role];
  const activeIndex = getActiveIndex(role, pathname);
  const [unreadActivityCount, setUnreadActivityCount] = useState(initialUnreadActivityCount);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const displayedActiveIndex = pendingHref
    ? tabs.findIndex((tab) => tab.href === pendingHref)
    : activeIndex;

  useEffect(() => {
    setUnreadActivityCount(initialUnreadActivityCount);
  }, [initialUnreadActivityCount]);

  useEffect(() => {
    setPendingHref(null);
  }, [activeIndex, pathname]);

  useEffect(() => {
    function handleRead() {
      setUnreadActivityCount((current) => Math.max(0, current - 1));
    }

    window.addEventListener("wellkept:activity-read", handleRead);
    return () => window.removeEventListener("wellkept:activity-read", handleRead);
  }, []);

  return (
    <div className="wk-role-shell" data-role={role} data-ui="calm">
      <div className="wk-route-stage">{children}</div>

      <nav
        aria-busy={pendingHref ? "true" : undefined}
        className={`wk-app-nav${pendingHref ? " is-navigating" : ""}`}
        aria-label={`${role} navigation`}
      >
        {tabs.map((tab, index) => {
          const { href, label, Icon } = tab;
          const active = index === displayedActiveIndex;
          const pending = href === pendingHref;
          return (
            <Link
              aria-label={`${label}${index === 2 && unreadActivityCount > 0 ? `, ${unreadActivityCount} unread` : ""}`}
              className={`wk-app-nav__item${active ? " is-active" : ""}${pending ? " is-pending" : ""}`}
              href={href}
              key={href}
              aria-current={index === activeIndex ? "page" : undefined}
              onClick={() => {
                triggerHaptic("selection");
                if (href !== pathname) setPendingHref(href);
              }}
              title={label}
            >
              <span className="wk-app-nav__icon">
                {active ? (
                  <span className="wk-app-nav__selection" />
                ) : null}
                <Icon aria-hidden="true" />
                {index === 2 && unreadActivityCount > 0 ? (
                  <b aria-hidden="true" className="wk-app-nav__badge">
                    {unreadActivityCount > 9 ? "9+" : unreadActivityCount}
                  </b>
                ) : null}
                {pending ? <i aria-hidden="true" className="wk-app-nav__pending" /> : null}
              </span>
              <span className="wk-app-nav__label">{label}</span>
            </Link>
          );
        })}
      </nav>
      <span className="sr-only" aria-live="polite">
        {pendingHref ? `Opening ${tabs.find((tab) => tab.href === pendingHref)?.label ?? "screen"}` : ""}
      </span>
    </div>
  );
}

function getActiveIndex(role: AppRole, pathname: string) {
  if (role === "customer") {
    if (pathname === "/customer/account" || pathname.startsWith("/customer/my-home")) return 0;
    if (pathname.startsWith("/customer/messages")) return 2;
    return 1;
  }

  if (pathname.startsWith("/cleaner/account")) return 0;
  if (pathname === "/cleaner" || pathname.startsWith("/cleaner/jobs/")) return 1;
  return 2;
}
