import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

const primaryActionBase =
  "wk-pressable relative inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-primary/20 bg-primary px-5 py-3 text-base font-extrabold text-primary-foreground shadow-[0_10px_24px_oklch(39%_0.08_145_/_0.16)] transition-[background-color,border-color,box-shadow,color,filter,opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-55 motion-reduce:transform-none";

type PrimaryActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

type PrimaryActionLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
};

export function PrimaryActionButton({
  children,
  className,
  ...props
}: PrimaryActionButtonProps) {
  return (
    <button className={cn(primaryActionBase, className)} {...props}>
      <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

export function PrimaryActionLink({
  children,
  className,
  href,
  ...props
}: PrimaryActionLinkProps) {
  return (
    <Link className={cn(primaryActionBase, className)} href={href} {...props}>
      <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2">
        {children}
      </span>
    </Link>
  );
}
