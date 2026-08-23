"use client";

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  MouseEvent,
  ReactNode,
} from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const pulseBase =
  "relative inline-flex min-h-12 items-center justify-center overflow-visible rounded-[var(--radius-control)] bg-primary px-5 py-3 text-base font-extrabold text-primary-foreground shadow-[0_14px_26px_oklch(39%_0.08_145_/_0.2)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-55 motion-reduce:shadow-none";

const rippleBase =
  "relative inline-flex min-h-11 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-primary/20 bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-55";

type PulsatingPrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

type PulsatingPrimaryLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
};

export function PulsatingPrimaryButton({
  children,
  className,
  ...props
}: PulsatingPrimaryButtonProps) {
  return (
    <button
      className={cn(pulseBase, className)}
      {...props}
    >
      <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

export function PulsatingPrimaryLink({
  children,
  className,
  href,
  ...props
}: PulsatingPrimaryLinkProps) {
  return (
    <Link
      className={cn(pulseBase, className)}
      href={href}
      {...props}
    >
      <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2">
        {children}
      </span>
    </Link>
  );
}

type Ripple = {
  key: number;
  size: number;
  x: number;
  y: number;
};

type RippleActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  duration?: number;
  rippleColor?: string;
};

type RippleActionLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  duration?: number;
  href: string;
  rippleColor?: string;
};

export function RippleActionButton({
  children,
  className,
  duration = 520,
  onClick,
  rippleColor = "oklch(98.8% 0.007 112 / 0.55)",
  ...props
}: RippleActionButtonProps) {
  const { ripples, createRipple } = useRipples(duration);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    createRipple(event);
    onClick?.(event);
  }

  return (
    <button className={cn(rippleBase, className)} onClick={handleClick} {...props}>
      <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2">
        {children}
      </span>
      <RippleLayer duration={duration} ripples={ripples} rippleColor={rippleColor} />
    </button>
  );
}

export function RippleActionLink({
  children,
  className,
  duration = 520,
  href,
  onClick,
  rippleColor = "oklch(98.8% 0.007 112 / 0.55)",
  ...props
}: RippleActionLinkProps) {
  const { ripples, createRipple } = useRipples(duration);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    createRipple(event);
    onClick?.(event);
  }

  return (
    <Link className={cn(rippleBase, className)} href={href} onClick={handleClick} {...props}>
      <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2">
        {children}
      </span>
      <RippleLayer duration={duration} ripples={ripples} rippleColor={rippleColor} />
    </Link>
  );
}

function useRipples(duration: number) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function createRipple(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    setRipples((current) => [
      ...current,
      {
        key: Date.now(),
        size,
        x: event.clientX - rect.left - size / 2,
        y: event.clientY - rect.top - size / 2,
      },
    ]);
  }

  useEffect(() => {
    if (ripples.length === 0) return;

    const timeout = window.setTimeout(() => {
      setRipples((current) => current.slice(1));
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [duration, ripples]);

  return { createRipple, ripples };
}

function RippleLayer({
  duration,
  rippleColor,
  ripples,
}: {
  duration: number;
  rippleColor: string;
  ripples: Ripple[];
}) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {ripples.map((ripple) => (
        <span
          key={ripple.key}
          className="absolute rounded-full opacity-30 animate-rippling motion-reduce:hidden"
          style={
            {
              "--duration": `${duration}ms`,
              backgroundColor: rippleColor,
              height: `${ripple.size}px`,
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
              transform: "scale(0)",
              width: `${ripple.size}px`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
