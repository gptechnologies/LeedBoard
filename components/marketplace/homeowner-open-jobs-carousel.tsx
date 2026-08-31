"use client";

import { Children, type ReactNode, useEffect, useRef, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export function HomeownerOpenJobsCarousel({
  children,
  className,
  initialIndex = 0,
  onSelectionChange,
}: {
  children: ReactNode;
  className?: string;
  initialIndex?: number;
  onSelectionChange?: (index: number) => void;
}) {
  const slides = Children.toArray(children).filter(Boolean);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const onSelectionChangeRef = useRef(onSelectionChange);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    if (!api) return;

    const startingIndex = Math.min(Math.max(initialIndex, 0), Math.max(slides.length - 1, 0));
    api.scrollTo(startingIndex, true);
    setCurrent(startingIndex);
    onSelectionChangeRef.current?.(startingIndex);

    const updateCurrent = () => {
      const nextIndex = api.selectedScrollSnap();
      setCurrent(nextIndex);
      onSelectionChangeRef.current?.(nextIndex);
    };

    api.on("select", updateCurrent);
    api.on("reInit", updateCurrent);

    return () => {
      api.off("select", updateCurrent);
      api.off("reInit", updateCurrent);
    };
  }, [api, initialIndex, slides.length]);

  if (slides.length === 0) return null;

  if (slides.length === 1) {
    return <div className={cn("customer-open-jobs-static", className)}>{slides[0]}</div>;
  }

  return (
    <Carousel
      className={cn("customer-open-jobs-carousel", className)}
      opts={{ align: "center" }}
      setApi={setApi}
    >
      <CarouselContent className="-ml-2">
        {slides.map((slide, index) => (
          <CarouselItem className="basis-full pl-2" key={index}>
            {slide}
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="customer-open-jobs-dots" aria-hidden="true">
        {slides.map((_, index) => (
          <span
            className={index === current ? "active" : ""}
            key={index}
          />
        ))}
      </div>

      <div className="customer-open-jobs-controls">
        <CarouselPrevious className="static translate-y-0" />
        <CarouselNext className="static translate-y-0" />
      </div>
    </Carousel>
  );
}
