"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { FastBidDrawer } from "@/components/marketplace/fast-bid-drawer";
import {
  NearbyJobSwipeCarousel,
  type NearbyJobSwipeItem,
} from "@/components/marketplace/nearby-job-swipe-carousel";
import { PassJobAction } from "@/components/marketplace/pass-job-action";

export type CleanerFeedJob = NearbyJobSwipeItem;

const refreshThreshold = 72;

export function CleanerJobsFeed({
  bidDefaults,
  error,
  initials,
  jobs,
  passed,
}: {
  bidDefaults: {
    standardHourlyRateCents: number | null;
    standardFlatRateCents: number | null;
    defaultEtaMinutes: number | null;
  };
  error?: string;
  initials: string;
  jobs: CleanerFeedJob[];
  passed: boolean;
}) {
  const router = useRouter();
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [index, setIndex] = useState(0);
  const current = jobs[index] ?? null;
  const refreshReady = pullDistance >= refreshThreshold;

  useEffect(() => {
    setIndex((currentIndex) => Math.min(currentIndex, Math.max(jobs.length - 1, 0)));
  }, [jobs.length]);

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
    <>
      <AppScreenHeader
        accountMenu
        initials={initials}
      />
      <div className="wk-screen-content">
        {error ? <div className="notice error">{error}</div> : null}
        {passed ? <div className="wk-provider-toast" role="status">Job moved to Passed.</div> : null}
        <section
          className={isRefreshing ? "cleaner-jobs-section is-refreshing" : "cleaner-jobs-section"}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ "--pull-distance": `${pullDistance}px` } as CSSProperties}
        >
          <div className={refreshReady ? "cleaner-refresh-indicator ready" : "cleaner-refresh-indicator"}>
            {isRefreshing ? "Refreshing..." : refreshReady ? "Release to refresh" : "Pull down to refresh"}
          </div>

          <NearbyJobSwipeCarousel
            index={index}
            jobs={jobs}
            onIndexChange={setIndex}
          />
          {jobs.length ? <JobCounter count={jobs.length} index={index} /> : null}
        </section>
      </div>
      {current ? (
        <div className="wk-provider-fixed-actions" aria-label="Job actions">
          <PassJobAction jobId={current.id} label="Pass" />
          <FastBidDrawer
            defaults={bidDefaults}
            job={current.job}
            timingLabel={current.timingLabel}
            trigger={<button className="wk-provider-primary-action wk-pressable" type="button">Bid</button>}
          />
        </div>
      ) : null}
    </>
  );
}

function JobCounter({ count, index }: { count: number; index: number }) {
  return (
    <div className="wk-provider-counter" aria-live="polite">
      <span>{count ? index + 1 : 0} of {count}</span>
      <div className="wk-provider-counter__dots" aria-hidden="true">
        {Array.from({ length: Math.min(count, 7) }, (_, dot) => (
          <i className={dot === Math.min(index, 6) ? "is-active" : ""} key={dot} />
        ))}
      </div>
    </div>
  );
}
