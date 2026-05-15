"use client";

import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { BriefcaseBusiness, Home, LogOut, MessageSquare, Settings, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AccountRole = `${UserRole}`;

type AccountUserButtonProps = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: AccountRole | null;
};

export function AccountUserButton({
  email,
  phone,
  firstName,
  lastName,
  role,
}: AccountUserButtonProps) {
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Account";
  const initials = getInitials(firstName, lastName, email, phone);
  const links = getRoleLinks(role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="account-menu-trigger"
          aria-label="Open account menu"
        >
          <Avatar size="lg" className="account-menu-avatar">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="account-menu-content">
        <div className="account-menu-identity">
          <Avatar size="lg" className="account-menu-avatar">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <strong>{displayName}</strong>
            <span>{email || phone}</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        {links.map((link) => (
          <DropdownMenuItem asChild key={link.href} className="account-menu-item">
            <Link href={link.href}>
              <link.Icon aria-hidden="true" />
              {link.label}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="account-menu-item account-menu-item--quiet">
          <form action="/auth/logout" method="post">
            <button type="submit">
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getRoleLinks(role?: AccountRole | null) {
  if (role === "CLEANER") {
    return [
      { href: "/cleaner", label: "Jobs", Icon: BriefcaseBusiness },
      { href: "/cleaner/bids", label: "Bids", Icon: UserRound },
      { href: "/cleaner/messages", label: "Messages", Icon: MessageSquare },
      { href: "/cleaner/account", label: "Account", Icon: Settings },
    ];
  }

  if (role === "CUSTOMER") {
    return [
      { href: "/customer", label: "Home", Icon: Home },
      { href: "/customer/jobs", label: "Jobs", Icon: BriefcaseBusiness },
      { href: "/customer/my-home", label: "Home presets", Icon: Home },
      { href: "/customer/account", label: "Account", Icon: Settings },
    ];
  }

  return [{ href: "/welcome", label: "Finish setup", Icon: UserRound }];
}

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
  phone?: string | null,
) {
  const initials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.trim();
  if (initials) return initials.toUpperCase();
  return email?.charAt(0).toUpperCase() ?? phone?.replace(/\D/g, "").slice(-2) ?? "A";
}
