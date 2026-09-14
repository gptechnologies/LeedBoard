"use client";

import { useEffect, useState } from "react";
import { AppNavigationProvider, type AppRole } from "@/components/marketplace/app-navigation-menu";

export function RoleSwipeShell({
  children,
  initialUnreadActivityCount = 0,
  role,
}: {
  children: React.ReactNode;
  initialUnreadActivityCount?: number;
  role: AppRole;
}) {
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
    <AppNavigationProvider role={role} unreadCount={unreadActivityCount}>
      <div className="wk-role-shell" data-role={role} data-ui="calm">
        <div className="wk-route-stage">{children}</div>
      </div>
    </AppNavigationProvider>
  );
}
