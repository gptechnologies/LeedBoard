"use client";
import { cloneElement, isValidElement, type ReactNode } from "react";
import type { CleanerUpNextJob } from "./cleaner-up-next-job-card";
export function FastBidDrawer({
  job,
  trigger,
  triggerMode,
}: {
  job: CleanerUpNextJob;
  defaults: unknown;
  timingLabel: string;
  trigger?: ReactNode;
  triggerMode?: "card" | "button";
}) {
  return (
    <form action={`/cleaner/jobs/${job.id}/respond`} method="post">
      {(isValidElement<{ type?: string }>(trigger)
        ? cloneElement(trigger, { type: "submit" })
        : trigger) ?? (
        <button className="effortless-primary" type="submit">
          {triggerMode === "button" ? "Send bid" : "Price & availability"}
        </button>
      )}
    </form>
  );
}
