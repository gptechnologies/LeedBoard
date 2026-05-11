"use client";

import { Children, type ReactNode, useEffect, useRef } from "react";
import {
  motion,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";

export function JobStackScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const cards = Children.toArray(children).filter(Boolean);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const scrollYProgress = useMotionValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    function updateProgress() {
      const node = containerRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const pageTop = rect.top + window.scrollY;
      const scrollRange = Math.max(1, node.offsetHeight - window.innerHeight * 0.45);
      const nextProgress = (window.scrollY - pageTop + window.innerHeight * 0.18) / scrollRange;

      scrollYProgress.set(Math.min(1, Math.max(0, nextProgress)));
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [prefersReducedMotion, scrollYProgress]);

  if (cards.length === 0) return null;

  if (cards.length === 1 || prefersReducedMotion) {
    return <div className={cn("grid gap-3", className)}>{cards}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative -mx-1 grid gap-4 pb-[28svh]",
        cards.length === 2 && "min-h-[70svh]",
        cards.length === 3 && "min-h-[92svh]",
        cards.length >= 4 && "min-h-[118svh]",
        className,
      )}
    >
      {cards.map((card, index) => (
        <StackedCard
          count={cards.length}
          index={index}
          key={index}
          progress={scrollYProgress}
        >
          {card}
        </StackedCard>
      ))}
    </div>
  );
}

function StackedCard({
  children,
  count,
  index,
  progress,
}: {
  children: ReactNode;
  count: number;
  index: number;
  progress: MotionValue<number>;
}) {
  const start = Math.max(0, index / count - 0.08);
  const targetScale = Math.max(0.86, 1 - (count - index - 1) * 0.045);
  const scale = useTransform(progress, [start, 1], [1, targetScale]);
  const y = useTransform(progress, [start, 1], [0, -index * 7]);

  return (
    <div className="sticky top-20">
      <motion.div
        className="origin-top px-1 will-change-transform"
        style={{ scale, y }}
      >
        {children}
      </motion.div>
    </div>
  );
}
