"use client";

export function SignOutButton() {
  return (
    <form action="/auth/logout" method="post">
      <button type="submit" className="button secondary">
        Sign Out
      </button>
    </form>
  );
}
