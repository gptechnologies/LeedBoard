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
      ? "status-badge active"
      : tone === "success"
      ? "status-badge success"
      : tone === "warning"
        ? "status-badge warning"
        : tone === "danger"
          ? "status-badge danger"
          : "status-badge";

  return (
    <span className={className}>
      <span className="status-dot" />
      {label}
    </span>
  );
}
