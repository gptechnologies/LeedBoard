"use client";

import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import { useRef, useState, type CSSProperties, type TouchEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  NearbyJobSwipeCarousel,
  type NearbyJobSwipeItem,
} from "@/components/marketplace/nearby-job-swipe-carousel";

export type CleanerFeedJob = NearbyJobSwipeItem;

const refreshThreshold = 72;

export function CleanerJobsFeed({ jobs }: { jobs: CleanerFeedJob[] }) {
  const router = useRouter();
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshReady = pullDistance >= refreshThreshold;

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    if (window.scrollY > 8 || isRefreshing) {
      startYRef.current = null;
      return;
    }

    startYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchMove(event: TouchEvent<HTMLElement>) {
    if (startYRef.current == null || window.scrollY > 8) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? startYRef.current;
    const distance = Math.max(0, currentY - startYRef.current);
    setPullDistance(Math.min(distance, refreshThreshold + 22));
  }

  function handleTouchEnd() {
    if (refreshReady) {
      setIsRefreshing(true);
      router.refresh();
      window.setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 700);
    } else {
      setPullDistance(0);
    }

    startYRef.current = null;
  }

  return (
    <section
      className={isRefreshing ? "cleaner-jobs-section is-refreshing" : "cleaner-jobs-section"}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ "--pull-distance": `${pullDistance}px` } as CSSProperties}
    >
      <div className="cleaner-section-header">
        <h2>Nearby Jobs</h2>
        <Button type="button" variant="ghost" size="sm" className="gap-1.5">
          Filter
          <Filter className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className={refreshReady ? "cleaner-refresh-indicator ready" : "cleaner-refresh-indicator"}>
        {isRefreshing ? "Refreshing..." : refreshReady ? "Release to refresh" : "Pull down to refresh"}
      </div>

      <NearbyJobSwipeCarousel jobs={jobs} />
    </section>
  );
}
