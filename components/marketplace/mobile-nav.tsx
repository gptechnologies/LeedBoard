"use client";

import { BriefcaseBusiness, Home, MessageCircle, UserRound } from "lucide-react";

import { BottomNav, type BottomNavItem } from "@/components/marketplace/bottom-nav";

const customerNav: BottomNavItem[] = [
  { href: "/customer", label: "Home", icon: <Home className="size-5" /> },
  { href: "/customer/jobs", label: "Jobs", icon: <BriefcaseBusiness className="size-5" /> },
  { href: "/customer/messages", label: "Messages", icon: <MessageCircle className="size-5" /> },
];

const cleanerNav: BottomNavItem[] = [
  { href: "/cleaner", label: "Jobs", icon: <BriefcaseBusiness className="size-5" /> },
  { href: "/cleaner/messages", label: "Messages", icon: <MessageCircle className="size-5" /> },
  { href: "/cleaner/account", label: "Account", icon: <UserRound className="size-5" /> },
];

export function MobileNav({ role }: { role: "customer" | "cleaner" }) {
  return (
    <BottomNav
      ariaLabel={role === "customer" ? "Customer navigation" : "Cleaner navigation"}
      items={role === "customer" ? customerNav : cleanerNav}
    />
  );
}
