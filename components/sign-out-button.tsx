"use client";

import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs";

export function SignOutButton() {
  return (
    <ClerkSignOutButton redirectUrl="/">
      <button type="button" className="button secondary">
        Sign Out
      </button>
    </ClerkSignOutButton>
  );
}
