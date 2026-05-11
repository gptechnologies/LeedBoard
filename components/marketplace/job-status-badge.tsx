import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type JobStatus =
  | "draft"
  | "open"
  | "bids-received"
  | "awarded"
  | "payment-held"
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "expired";

const statusConfig: Record<
  JobStatus,
  {
    label: string;
    className: string;
  }
> = {
  draft: {
    label: "Draft",
    className: "border-border bg-muted text-muted-foreground",
  },
  open: {
    label: "Open",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  "bids-received": {
    label: "Bids in",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  awarded: {
    label: "Accepted",
    className: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
  },
  "payment-held": {
    label: "Payment held",
    className: "border-[var(--warning)]/35 bg-[var(--warning)]/10 text-[var(--warning)]",
  },
  scheduled: {
    label: "Scheduled",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  "in-progress": {
    label: "In progress",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  completed: {
    label: "Done",
    className: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  expired: {
    label: "Expired",
    className: "border-[var(--warning)]/35 bg-[var(--warning)]/10 text-[var(--warning)]",
  },
};

export function JobStatusBadge({
  className,
  label,
  status,
}: {
  className?: string;
  label?: string;
  status: JobStatus;
}) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 whitespace-nowrap", config.className, className)}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label ?? config.label}
    </Badge>
  );
}
