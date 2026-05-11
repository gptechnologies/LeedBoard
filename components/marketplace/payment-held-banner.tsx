import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function PaymentHeldBanner({
  action,
  amount,
  className,
  description = "Your payment is held until the job is done.",
  title = "Payment held",
}: {
  action?: ReactNode;
  amount?: string;
  className?: string;
  description?: string;
  title?: string;
}) {
  return (
    <Alert
      className={cn(
        "border-[var(--warning)]/30 bg-[var(--warning)]/10 text-foreground",
        action && "pr-24",
        className,
      )}
    >
      <ShieldCheck className="size-4 text-[var(--warning)]" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {amount ? `${amount} is held. ` : null}
        {description}
      </AlertDescription>
      {action ? <AlertAction>{action}</AlertAction> : null}
    </Alert>
  );
}
