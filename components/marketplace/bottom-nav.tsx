"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BottomNavItem = {
  badge?: string | number;
  href: string;
  icon?: ReactNode;
  label: string;
};

export function BottomNav({
  ariaLabel = "App navigation",
  className,
  items,
}: {
  ariaLabel?: string;
  className?: string;
  items: BottomNavItem[];
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "fixed inset-x-6 bottom-[max(10px,env(safe-area-inset-bottom))] z-40 mx-auto grid max-w-sm grid-cols-[repeat(var(--nav-count),minmax(0,1fr))] gap-1 rounded-[var(--radius-card)] border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur",
        className,
      )}
      style={{ "--nav-count": items.length } as React.CSSProperties}
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative grid min-h-12 place-items-center gap-0.5 rounded-[var(--radius-control)] px-1.5 py-1 text-xs font-semibold text-muted-foreground transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
              active && "bg-primary/10 text-primary",
            )}
          >
            {item.badge !== undefined ? (
              <Badge className="absolute right-1.5 top-1 min-w-5 px-1 text-[0.65rem]">
                {item.badge}
              </Badge>
            ) : null}
            {item.icon ? <span className="grid size-5 place-items-center">{item.icon}</span> : null}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
