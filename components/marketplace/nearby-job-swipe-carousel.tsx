"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { A11y, EffectCards, Keyboard, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { EmptyState } from "@/components/marketplace/empty-state";
import { RippleActionLink } from "@/components/marketplace/motion-buttons";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type NearbyJobSwipeItem = {
  areaLabel: string;
  bathroomCount: number | null;
  bedroomCount: number | null;
  hasPets: boolean;
  id: string;
  postedLabel: string;
  title: string;
};

export function NearbyJobSwipeCarousel({
  jobs,
}: {
  jobs: NearbyJobSwipeItem[];
}) {
  const prefersReducedMotion = useReducedMotion();

  if (jobs.length === 0) {
    return (
      <EmptyState
        body="New jobs that match your area will show here."
        title="No jobs right now"
      />
    );
  }

  if (prefersReducedMotion || jobs.length === 1) {
    return (
      <div className="grid gap-3" aria-live="polite">
        {jobs.map((job) => (
          <NearbyJobCard job={job} key={job.id} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative px-3 pb-10 pt-1" aria-live="polite">
      <Swiper
        a11y={{
          enabled: true,
          nextSlideMessage: "Show next nearby job",
          prevSlideMessage: "Show previous nearby job",
        }}
        className="wk-nearby-swiper"
        effect="cards"
        grabCursor
        keyboard={{ enabled: true }}
        modules={[A11y, EffectCards, Keyboard, Navigation, Pagination]}
        navigation={{
          nextEl: ".wk-nearby-next",
          prevEl: ".wk-nearby-prev",
        }}
        pagination={{ clickable: true }}
      >
        {jobs.map((job) => (
          <SwiperSlide className="!overflow-visible" key={job.id}>
            <NearbyJobCard job={job} raised />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          aria-label="Show previous nearby job"
          className="wk-nearby-prev inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-primary/40"
          type="button"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          aria-label="Show next nearby job"
          className="wk-nearby-next inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-primary/40"
          type="button"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function NearbyJobCard({
  job,
  raised = false,
}: {
  job: NearbyJobSwipeItem;
  raised?: boolean;
}) {
  return (
    <Card
      className={cn(
        "min-h-[360px] overflow-hidden py-0",
        raised && "shadow-[0_24px_56px_oklch(38%_0.035_112_/_0.18)]",
      )}
    >
      <CardContent className="flex h-full min-h-[360px] flex-col justify-between gap-5 p-5">
        <div className="grid gap-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
            {job.postedLabel}
          </span>
          <div className="grid gap-2">
            <strong className="[overflow-wrap:anywhere] text-2xl font-extrabold leading-tight text-foreground">
              {job.title}
            </strong>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <MapPin className="size-4" aria-hidden="true" />
              {job.areaLabel}
            </span>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {job.bedroomCount != null ? (
              <DetailPill>
                {job.bedroomCount} {job.bedroomCount === 1 ? "Bed" : "Beds"}
              </DetailPill>
            ) : null}
            {job.bathroomCount != null ? (
              <DetailPill>
                {job.bathroomCount} {job.bathroomCount === 1 ? "Bath" : "Baths"}
              </DetailPill>
            ) : null}
            <DetailPill>{job.hasPets ? "Has Pets" : "No Pets"}</DetailPill>
          </div>

          <RippleActionLink className="w-full" href={`/cleaner/jobs/${job.id}`}>
            Bid
          </RippleActionLink>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
      {children}
    </span>
  );
}
