import { BidSelectionPriority, UserRole } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = Promise<{
  id: string;
}>;

const priorityOptions = [
  {
    value: BidSelectionPriority.BEST_OVERALL,
    label: "Best overall",
    description: "Balance reputation, timing, and price.",
  },
  {
    value: BidSelectionPriority.CHEAPEST,
    label: "Cheapest",
    description: "Show the lowest estimated total first.",
  },
  {
    value: BidSelectionPriority.FASTEST,
    label: "Fastest",
    description: "Prioritize cleaners who can arrive soonest.",
  },
  {
    value: BidSelectionPriority.BEST_QUALITY,
    label: "Best quality",
    description: "Prioritize ratings, reviews, and trust signals.",
  },
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
      id: true,
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
            <h1>How should we rank bids?</h1>
          </div>
        </header>

        <form action={`/customer/jobs/${job.id}/priority/save`} method="post" className="market-form stack">
          <section className="market-form-section market-question-flow">
            <section className="market-question-block stack">
              <div className="market-question-copy">
                <span>{job.title}</span>
                <h3>Choose what matters most for this job.</h3>
                <p>We will use this to sort bids as cleaners respond.</p>
              </div>

              <div className="market-cleaning-presets" role="radiogroup" aria-label="Bid ranking priority">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className={
                      option.value === job.selectionPriority
                        ? "market-cleaning-preset active"
                        : "market-cleaning-preset"
                    }
                  >
                    <input
                      type="radio"
                      name="selectionPriority"
                      value={option.value}
                      defaultChecked={option.value === job.selectionPriority}
                    />
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </label>
                ))}
              </div>
            </section>
          </section>

          <div className="market-wizard-actions market-wizard-actions--first">
            <div className="market-wizard-actions__row">
              <button type="submit" className="button flex-1">
                Continue
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
