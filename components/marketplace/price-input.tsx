import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PriceInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  currencySymbol?: string;
  helperText?: string;
  errorText?: string;
};

export const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  (
    {
      className,
      currencySymbol = "$",
      errorText,
      helperText,
      id,
      inputMode = "decimal",
      ...props
    },
    ref,
  ) => {
    const helperId = id && helperText ? `${id}-helper` : undefined;
    const errorId = id && errorText ? `${id}-error` : undefined;
    const describedBy = [
      helperId,
      errorId,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="grid gap-2">
        <div
          className={cn(
            "grid min-h-14 grid-cols-[auto_minmax(0,1fr)] items-center rounded-[var(--radius-control)] border border-input bg-card px-3 text-foreground shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
            errorText && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
            className,
          )}
        >
          <span className="pr-2 text-lg font-bold text-muted-foreground" aria-hidden="true">
            {currencySymbol}
          </span>
          <Input
            ref={ref}
            id={id}
            type="text"
            inputMode={inputMode}
            aria-invalid={Boolean(errorText)}
            aria-describedby={describedBy || undefined}
            className="min-h-12 border-0 bg-transparent px-0 text-lg font-bold tabular-nums shadow-none focus-visible:ring-0"
            {...props}
          />
        </div>
        {helperText ? (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        ) : null}
        {errorText ? (
          <p id={errorId} className="text-sm font-medium text-destructive">
            {errorText}
          </p>
        ) : null}
      </div>
    );
  },
);

PriceInput.displayName = "PriceInput";
