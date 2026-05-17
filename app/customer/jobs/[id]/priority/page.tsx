import {
  BidSelectionPriority,
  HomeCondition,
  JobCleanType,
  JobPriorityArea,
  UserRole,
} from "@prisma/client";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = Promise<{
  id: string;
}>;

const cleanTypeOptions = [
  { value: JobCleanType.STANDARD_CLEAN, label: "Standard Clean" },
  { value: JobCleanType.DEEP_CLEAN, label: "Deep Clean" },
  { value: JobCleanType.MOVE_OUT_CLEAN, label: "Move-Out Clean" },
  { value: JobCleanType.RECURRING_CLEAN, label: "Recurring Clean" },
  { value: JobCleanType.ASAP_REFRESH, label: "ASAP Refresh" },
] as const;

const conditionOptions = [
  { value: HomeCondition.LIGHT_TOUCH_UP, label: "Light touch-up" },
  { value: HomeCondition.NORMAL_LIVED_IN, label: "Normal lived-in" },
  { value: HomeCondition.NEEDS_EXTRA_ATTENTION, label: "Needs extra attention" },
] as const;

const priorityAreaOptions = [
  { value: JobPriorityArea.KITCHEN, label: "Kitchen" },
  { value: JobPriorityArea.BATHROOMS, label: "Bathrooms" },
  { value: JobPriorityArea.FLOORS, label: "Floors" },
  { value: JobPriorityArea.PET_HAIR, label: "Pet hair" },
  { value: JobPriorityArea.INSIDE_FRIDGE, label: "Inside fridge" },
  { value: JobPriorityArea.INSIDE_OVEN, label: "Inside oven" },
] as const;

const selectionPriorityOptions = [
  { value: BidSelectionPriority.CHEAPEST, label: "Best Price" },
  { value: BidSelectionPriority.BEST_QUALITY, label: "Best rating/review" },
  { value: BidSelectionPriority.FASTEST, label: "Fastest Arrival" },
] as const;

export default async function CustomerJobPriorityPage({ params }: { params: Params }) {
  const user = await requireUser(UserRole.CUSTOMER);
  const { id } = await params;
  const job = await prisma.jobRequest.findFirst({
    where: {
      id,
      customerId: user.id,
    },
    select: {
      cleanType: true,
      currentCondition: true,
      id: true,
      matchingPriorityAreas: true,
      selectionPriority: true,
      title: true,
    },
  });

  if (!job) {
    notFound();
  }

  return (
    <div className="market-shell market-shell--detail">
      <section className="market-surface">
        <header className="market-topbar market-topbar--detail">
          <div>
            <div className="market-kicker">Request posted</div>
            <h1>Your job is being posted</h1>
            <p>Answer a few details so cleaners can price and prioritize the work with more confidence.</p>
          </div>
        </header>

        <form action={`/customer/jobs/${job.id}/priority/save`} method="post" className="market-form stack">
          <section className="market-form-section market-question-flow">
            <MatchingQuestion
              eyebrow="Most important"
              title="What type of clean do you need?"
              description="This helps cleaners understand the expected scope before they bid."
            >
              <div className="market-cleaning-presets market-cleaning-presets--compact" role="radiogroup" aria-label="Clean type">
                {cleanTypeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="market-cleaning-preset market-cleaning-preset--choice"
                  >
                    <input
                      type="radio"
                      name="cleanType"
                      value={option.value}
                      defaultChecked={(job.cleanType ?? JobCleanType.STANDARD_CLEAN) === option.value}
                    />
                    <strong>{option.label}</strong>
                  </label>
                ))}
              </div>
            </MatchingQuestion>

            <MatchingQuestion
              eyebrow="Condition"
              title="How would you describe the current condition?"
              description="Cleaners use this to decide time, supplies, and whether they are a good fit."
            >
              <div className="market-cleaning-presets market-cleaning-presets--compact" role="radiogroup" aria-label="Current condition">
                {conditionOptions.map((option) => (
                  <label
                    key={option.value}
                    className="market-cleaning-preset market-cleaning-preset--choice"
                  >
                    <input
                      type="radio"
                      name="currentCondition"
                      value={option.value}
                      defaultChecked={(job.currentCondition ?? HomeCondition.NORMAL_LIVED_IN) === option.value}
                    />
                    <strong>{option.label}</strong>
                  </label>
                ))}
              </div>
            </MatchingQuestion>

            <MatchingQuestion
              eyebrow="Priority areas"
              title="Any priority areas?"
              description="Select anything cleaners should pay special attention to."
            >
              <div className="market-focus-chip-grid" aria-label="Priority areas">
                {priorityAreaOptions.map((option) => (
                  <label key={option.value} className="market-focus-chip market-focus-chip--checkbox">
                    <input
                      type="checkbox"
                      name="matchingPriorityAreas"
                      value={option.value}
                      defaultChecked={job.matchingPriorityAreas.includes(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </MatchingQuestion>

            <MatchingQuestion
              eyebrow={job.title}
              title="What is most important to you?"
              description="We will use this to sort bids after cleaners respond."
            >
              <div className="market-cleaning-presets market-cleaning-presets--compact" role="radiogroup" aria-label="Bid sorting priority">
                {selectionPriorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className="market-cleaning-preset market-cleaning-preset--choice"
                  >
                    <input
                      type="radio"
                      name="selectionPriority"
                      value={option.value}
                      defaultChecked={
                        option.value ===
                        (job.selectionPriority === BidSelectionPriority.BEST_OVERALL
                          ? BidSelectionPriority.BEST_QUALITY
                          : job.selectionPriority)
                      }
                    />
                    <strong>{option.label}</strong>
                  </label>
                ))}
              </div>
            </MatchingQuestion>
          </section>

          <div className="market-wizard-actions market-wizard-actions--first">
            <div className="market-wizard-actions__row">
              <button type="submit" className="button flex-1">
                Improve Matching
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function MatchingQuestion({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="market-question-block stack">
      <div className="market-question-copy">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}
