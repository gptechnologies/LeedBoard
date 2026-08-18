"use client";

import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppAccountMenu({ initials }: { initials: string }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open account menu"
          className="wk-screen-header__action wk-screen-header__account"
          type="button"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="wk-app-account-menu"
        sideOffset={8}
      >
        <DropdownMenuItem
          className="wk-app-account-menu__logout"
          disabled={isLoggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
          variant="destructive"
        >
          {isLoggingOut ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
