import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "default" | "active" | "success" | "warning" | "danger";

export function StatusPill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: StatusTone;
}) {
  const className =
    tone === "active"
      ? "border-primary/30 bg-primary text-primary-foreground"
      : tone === "success"
      ? "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]"
      : tone === "warning"
        ? "border-[var(--warning)]/35 bg-[var(--warning)]/10 text-[var(--warning)]"
        : tone === "danger"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-muted-foreground";

  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </Badge>
  );
}
