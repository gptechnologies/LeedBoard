import type { ReactNode } from "react";
import { ShieldCheck, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BidStatus = "submitted" | "accepted" | "declined" | "withdrawn";

const bidStatusConfig: Record<BidStatus, { label: string; className: string }> = {
  submitted: {
    label: "Sent",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  accepted: {
    label: "Accepted",
    className: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
  },
  declined: {
    label: "Declined",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  withdrawn: {
    label: "Withdrawn",
    className: "border-muted-foreground/20 bg-muted text-muted-foreground",
  },
};

export function BidCard({
  action,
  amount,
  avatarUrl,
  className,
  cleanerName,
  headline,
  insured,
  message,
  rating,
  reviewCount,
  selected = false,
  status = "submitted",
  timing,
}: {
  action?: ReactNode;
  amount: string;
  avatarUrl?: string;
  className?: string;
  cleanerName: string;
  headline?: string;
  insured?: boolean;
  message?: string;
  rating?: string;
  reviewCount?: string;
  selected?: boolean;
  status?: BidStatus;
  timing?: string;
}) {
  const statusConfig = bidStatusConfig[status];
  const initials = cleanerName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      className={cn(
        selected && "border-primary bg-primary/5 ring-primary/20",
        className,
      )}
    >
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage src={avatarUrl} alt="" />
            <AvatarFallback>{initials || "WK"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">{cleanerName}</CardTitle>
            {headline ? <CardDescription className="truncate">{headline}</CardDescription> : null}
          </div>
        </div>
        <CardAction>
          <Badge variant="outline" className={cn("gap-1.5", statusConfig.className)}>
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            {statusConfig.label}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          {rating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Star className="size-3.5 text-primary" aria-hidden="true" />
              {rating}
            </span>
          ) : null}
          {reviewCount ? (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {reviewCount}
            </span>
          ) : null}
          {insured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Insured
            </span>
          ) : null}
        </div>
        {message ? <p className="text-sm leading-6 text-muted-foreground">{message}</p> : null}
        <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
          <div className="grid gap-1">
            {timing ? <span className="text-sm text-muted-foreground">{timing}</span> : null}
            <strong className="text-2xl font-bold tabular-nums text-primary">{amount}</strong>
          </div>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
