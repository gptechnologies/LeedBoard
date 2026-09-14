"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import { AppScreenHeader } from "@/components/marketplace/app-screen-header";
import { CleanerSearchingJobsState } from "@/components/marketplace/cleaner-searching-jobs-state";
import { FastBidDrawer } from "@/components/marketplace/fast-bid-drawer";
import {
  NearbyJobSwipeCarousel,
  type NearbyJobSwipeItem,
} from "@/components/marketplace/nearby-job-swipe-carousel";
import { PassJobAction } from "@/components/marketplace/pass-job-action";
import { triggerHaptic } from "@/lib/haptics";

export type CleanerFeedJob = NearbyJobSwipeItem;

const refreshThreshold = 72;

export function CleanerJobsFeed({
  bidDefaults,
  error,
  jobs,
  passed,
}: {
  bidDefaults: {
    standardHourlyRateCents: number | null;
    standardFlatRateCents: number | null;
    defaultEtaMinutes: number | null;
  };
  error?: string;
  jobs: CleanerFeedJob[];
  passed: boolean;
}) {
  const router = useRouter();
  const startYRef = useRef<number | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [index, setIndex] = useState(0);
  const current = jobs[index] ?? null;
  const refreshReady = pullDistance >= refreshThreshold;

  useEffect(() => {
    setIndex((currentIndex) => Math.min(currentIndex, Math.max(jobs.length - 1, 0)));
  }, [jobs.length]);

  useEffect(() => {
    if (jobs.length > 0) return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [jobs.length, router]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  function refreshJobs() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    router.refresh();
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = window.setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
      refreshTimeoutRef.current = null;
    }, 700);
  }

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
      refreshJobs();
    } else {
      setPullDistance(0);
    }

    startYRef.current = null;
  }

  function moveJob(direction: -1 | 1) {
    const next = Math.min(Math.max(index + direction, 0), jobs.length - 1);
    if (next === index) return;
    setIndex(next);
    triggerHaptic("light");
  }

  return (
    <>
      <AppScreenHeader brandHref="/cleaner" />
      <div className="wk-screen-content">
        {error ? <div className="notice error">{error}</div> : null}
        {passed ? <div className="wk-provider-toast" role="status">Job moved to Passed.</div> : null}
        <section
          className={`cleaner-jobs-section${isRefreshing ? " is-refreshing" : ""}${jobs.length === 0 ? " is-empty" : ""}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ "--pull-distance": `${pullDistance}px` } as CSSProperties}
        >
          <div className={refreshReady ? "cleaner-refresh-indicator ready" : "cleaner-refresh-indicator"}>
            {isRefreshing ? "Refreshing..." : refreshReady ? "Release to refresh" : "Pull down to refresh"}
          </div>

          {current ? (
            <NearbyJobSwipeCarousel
              footer={(job) => (
                <div className="wk-provider-card-actions" aria-label="Job actions">
                  <PassJobAction jobId={job.id} label="Pass" />
                  <FastBidDrawer
                    defaults={bidDefaults}
                    job={job.job}
                    timingLabel={job.timingLabel}
                    trigger={<button className="wk-provider-primary-action wk-pressable" type="button">Bid</button>}
                  />
                </div>
              )}
              index={index}
              jobs={jobs}
              onIndexChange={setIndex}
            />
          ) : (
            <CleanerSearchingJobsState isRefreshing={isRefreshing} onRefresh={refreshJobs} />
          )}
          {jobs.length > 1 ? (
            <div className="wk-provider-deck-nav" aria-label="Browse nearby jobs" role="group">
              <button
                aria-label="Previous job"
                disabled={index === 0}
                onClick={() => moveJob(-1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <JobCounter count={jobs.length} index={index} />
              <button
                aria-label="Next job"
                disabled={index === jobs.length - 1}
                onClick={() => moveJob(1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </section>
      </div>
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
