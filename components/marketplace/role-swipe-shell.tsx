"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Home, MessageCircle, Plus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { triggerHaptic } from "@/lib/haptics";

type AppRole = "customer" | "cleaner";

const roleTabs = {
  customer: [
    { href: "/customer/account", label: "Home", Icon: Home },
    { href: "/customer/jobs/new", label: "Post", Icon: Plus, primary: true },
    { href: "/customer/jobs", label: "Activity", Icon: MessageCircle },
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

  useEffect(() => {
    setUnreadActivityCount(initialUnreadActivityCount);
  }, [initialUnreadActivityCount]);

  useEffect(() => {
    function handleRead() {
      setUnreadActivityCount((current) => Math.max(0, current - 1));
    }

    window.addEventListener("wellkept:activity-read", handleRead);
    return () => window.removeEventListener("wellkept:activity-read", handleRead);
  }, []);

  return (
    <div className="wk-role-shell" data-role={role} data-ui="calm">
      <div className="wk-route-transition" key={pathname}>
        {children}
      </div>

      <nav className="wk-app-nav" aria-label={`${role} navigation`}>
        {tabs.map((tab, index) => {
          const { href, label, Icon } = tab;
          const primary = "primary" in tab && tab.primary;
          const active = index === activeIndex;
          return (
            <Link
              className={`wk-app-nav__item${primary ? " wk-app-nav__item--primary" : ""}${active ? " is-active" : ""}`}
              href={href}
              key={href}
              aria-current={active ? "page" : undefined}
              onClick={() => triggerHaptic("selection")}
            >
              <span className="wk-app-nav__icon">
                <Icon aria-hidden="true" />
                {index === 2 && unreadActivityCount > 0 ? (
                  <b className="wk-app-nav__badge" aria-label={`${unreadActivityCount} unread activity items`}>
                    {unreadActivityCount > 9 ? "9+" : unreadActivityCount}
                  </b>
                ) : null}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function getActiveIndex(role: AppRole, pathname: string) {
  if (role === "customer") {
    if (pathname === "/customer/account" || pathname.startsWith("/customer/my-home")) return 0;
    if (pathname === "/customer/jobs/new" || pathname === "/customer") return 1;
    return 2;
  }

  if (pathname.startsWith("/cleaner/account")) return 0;
  if (pathname === "/cleaner" || pathname.startsWith("/cleaner/jobs/")) return 1;
  return 2;
}
