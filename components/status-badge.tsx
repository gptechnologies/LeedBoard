import { BookingStatus } from "@prisma/client";
import { customerVisibleStatuses } from "@/lib/bookings";

export function StatusBadge({ status }: { status: BookingStatus }) {
  const tone =
    status === BookingStatus.COMPLETED
      ? "success"
      : status === BookingStatus.CANCELLED
        ? "danger"
        : status === BookingStatus.PENDING_PAYMENT
          ? "warning"
          : "";

  return (
    <span className={`status-badge ${tone}`}>
      <span className="status-dot" />
      {customerVisibleStatuses[status]}
    </span>
  );
}
