import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, MapPin } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { JobStatus, JobStatusBadge } from "@/components/marketplace/job-status-badge";

type JobCardVariant = "customer" | "cleaner" | "compact";

export function JobCard({
  action,
  bidCount,
  className,
  details = [],
  href,
  location,
  priceLabel,
  status,
  statusLabel,
  timing,
  title,
  variant = "customer",
}: {
  action?: ReactNode;
  bidCount?: number;
  className?: string;
  details?: string[];
  href?: string;
  location?: string;
  priceLabel?: string;
  status?: JobStatus;
  statusLabel?: string;
  timing?: string;
  title: string;
  variant?: JobCardVariant;
}) {
  const content = (
    <Card
      className={cn(
        "gap-3 transition focus-within:ring-3 focus-within:ring-ring/25",
        href && "hover:border-primary/40 hover:shadow-md",
        variant === "compact" && "py-3",
        className,
      )}
    >
      <CardHeader>
        <div className="grid gap-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          {location ? (
            <CardDescription className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {location}
            </CardDescription>
          ) : null}
        </div>
        {status ? (
          <CardAction>
            <JobStatusBadge status={status} label={statusLabel} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3">
        {timing ? (
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden="true" />
            {timing}
          </div>
        ) : null}
        {details.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {details.map((detail) => (
              <span
                key={detail}
                className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {detail}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
          <div className="grid gap-0.5">
            {bidCount !== undefined ? (
              <span className="text-sm font-bold text-foreground">
                {bidCount} {bidCount === 1 ? "bid" : "bids"}
              </span>
            ) : null}
            {priceLabel ? (
              <span className="text-lg font-bold tabular-nums text-primary">
                {priceLabel}
              </span>
            ) : null}
          </div>
          {action}
        </div>
      </CardContent>
    </Card>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
      {content}
    </Link>
  );
}
