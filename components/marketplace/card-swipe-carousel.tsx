"use client";

import { Children, type ReactNode, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y, EffectCards, Keyboard, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { cn } from "@/lib/utils";

export function CardSwipeCarousel({
  children,
  className,
  controlsLabel = "cards",
}: {
  children: ReactNode;
  className?: string;
  controlsLabel?: string;
}) {
  const cards = Children.toArray(children).filter(Boolean);
  const prefersReducedMotion = useReducedMotion();
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);

  if (cards.length === 0) return null;

  if (cards.length === 1 || prefersReducedMotion) {
    return <div className={cn("grid gap-3", className)}>{cards}</div>;
  }

  return (
    <div
      className={cn(
        "relative mx-auto w-[min(100%,318px)] max-w-full overflow-hidden pb-10 pt-1",
        className,
      )}
      aria-live="polite"
    >
      <Swiper
        a11y={{
          enabled: true,
          nextSlideMessage: `Show next ${controlsLabel}`,
          prevSlideMessage: `Show previous ${controlsLabel}`,
        }}
        autoHeight
        className="wk-card-swipe-swiper"
        effect="cards"
        grabCursor
        keyboard={{ enabled: true }}
        modules={[A11y, EffectCards, Keyboard, Pagination]}
        onSwiper={setSwiper}
        pagination={{ clickable: true }}
      >
        {cards.map((card, index) => (
          <SwiperSlide className="!h-auto !overflow-visible" key={index}>
            {card}
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          aria-label={`Show previous ${controlsLabel}`}
          className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          onClick={() => swiper?.slidePrev()}
          type="button"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          aria-label={`Show next ${controlsLabel}`}
          className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          onClick={() => swiper?.slideNext()}
          type="button"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
