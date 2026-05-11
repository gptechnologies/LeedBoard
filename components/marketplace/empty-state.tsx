import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  action,
  body,
  className,
  icon,
  title,
}: {
  action?: ReactNode;
  body: string;
  className?: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <Card className={cn("items-start text-left", className)}>
      <CardHeader className="gap-3">
        {icon ? (
          <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        ) : null}
        <div className="grid gap-1">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{body}</CardDescription>
        </div>
      </CardHeader>
      {action ? <CardContent>{action}</CardContent> : null}
    </Card>
  );
}
