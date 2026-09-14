"use client";

import { LogOut, MapPin, Menu as MenuIcon, MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { triggerHaptic } from "@/lib/haptics";

export type AppRole = "customer" | "cleaner";

const NavigationContext = createContext<{ role: AppRole; unreadCount: number } | null>(null);

export function AppNavigationProvider({
  children,
  role,
  unreadCount,
}: {
  children: ReactNode;
  role: AppRole;
  unreadCount: number;
}) {
  return <NavigationContext.Provider value={{ role, unreadCount }}>{children}</NavigationContext.Provider>;
}

export function AppNavigationMenu() {
  const navigation = useContext(NavigationContext);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  if (!navigation) return null;

  const { role, unreadCount } = navigation;
  const items = [
    { href: `/${role}/account`, label: "Account", Icon: UserRound, section: "account" },
    { href: `/${role}`, label: role === "cleaner" ? "Nearby Jobs" : "Jobs", Icon: MapPin, section: "jobs" },
    { href: `/${role}/messages`, label: "Messages", Icon: MessageCircle, section: "messages" },
  ] as const;
  const activeSection = getActiveSection(role, pathname);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Logout failed");
      window.location.replace("/login");
    } catch {
      const form = document.createElement("form");
      form.action = "/auth/logout";
      form.method = "post";
      document.body.appendChild(form);
      form.submit();
    }
  }

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <button className="wk-app-menu-trigger wk-pressable" type="button">
          <MenuIcon aria-hidden="true" />
          <span>Menu</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="wk-app-navigation-menu" sideOffset={8}>
        {items.map(({ href, label, Icon, section }) => (
          <DropdownMenuItem asChild className="wk-app-navigation-menu__item" key={href}>
            <Link
              aria-current={activeSection === section ? "page" : undefined}
              aria-label={section === "messages" && unreadCount > 0 ? `${label}, ${unreadCount} unread` : label}
              href={href}
              onClick={() => triggerHaptic("selection")}
            >
              <span className="wk-app-navigation-menu__icon">
                <Icon aria-hidden="true" />
                {section === "messages" && unreadCount > 0 ? (
                  <b aria-hidden="true" className="wk-app-navigation-menu__badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </b>
                ) : null}
              </span>
              <span>{label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          className="wk-app-navigation-menu__item wk-app-navigation-menu__logout"
          disabled={isLoggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          <span className="wk-app-navigation-menu__icon"><LogOut aria-hidden="true" /></span>
          <span>{isLoggingOut ? "Logging out…" : "Log Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getActiveSection(role: AppRole, pathname: string) {
  if (pathname.startsWith(`/${role}/messages`)) return "messages";
  if (pathname.startsWith(`/${role}/account`) || pathname.startsWith("/customer/my-home") || pathname.startsWith("/cleaner/availability")) return "account";
  return "jobs";
}
