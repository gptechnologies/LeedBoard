"use client";

import { useEffect } from "react";

export function ActivityReadMarker({ bidId, role }: { bidId: string; role: "customer" | "cleaner" }) {
  useEffect(() => {
    let active = true;

    async function markRead() {
      const response = await fetch(`/api/activity/${bidId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (active && response.ok) {
        window.dispatchEvent(new CustomEvent("wellkept:activity-read", { detail: { bidId } }));
      }
    }

    void markRead();
    return () => {
      active = false;
    };
  }, [bidId, role]);

  return null;
}
