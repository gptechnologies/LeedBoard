import { CheckCircle2, Circle, Loader2, ShieldCheck, Sparkles } from "lucide-react";

type JobActivityPanelProps = {
  activeBidCount: number;
  insuredCleanerCount: number;
  matchedCleanerCount: number;
  topRating?: number | null;
};

export function JobActivityPanel({
  activeBidCount,
  insuredCleanerCount,
  matchedCleanerCount,
  topRating,
}: JobActivityPanelProps) {
  const hasBids = activeBidCount > 0;
  const hasMatches = matchedCleanerCount > 0;

  return (
    <section className="market-activity-panel" aria-labelledby="job-activity-title">
      <div className="market-activity-panel__header">
        <span className="market-activity-panel__icon" aria-hidden="true">
          {hasBids ? <Sparkles /> : <Loader2 className="market-activity-panel__spinner" />}
        </span>
        <div>
          <p className="market-kicker">Request active</p>
          <h2 id="job-activity-title">
            {hasBids ? "Bids are coming in" : "Finding your cleaner"}
          </h2>
        </div>
      </div>

      <p className="market-activity-panel__copy">
        {hasBids
          ? "We are ranking bids by trust, timing, and price so you can choose quickly."
          : "We are matching your request with vetted cleaners who fit the location, timing, and cleaning type."}
      </p>

      <div className="market-activity-metrics" aria-label="Matching progress">
        <div>
          <strong>{hasMatches ? matchedCleanerCount : "Soon"}</strong>
          <span>{hasMatches ? "matched cleaners" : "matching"}</span>
        </div>
        <div>
          <strong>{activeBidCount}</strong>
          <span>active {activeBidCount === 1 ? "bid" : "bids"}</span>
        </div>
        <div>
          <strong>{insuredCleanerCount}</strong>
          <span>insured matches</span>
        </div>
      </div>

      <ol className="market-activity-steps" aria-label="Job progress">
        <ActivityStep state="complete" label="Job posted" />
        <ActivityStep
          state={hasMatches ? "complete" : "current"}
          label={hasMatches ? "Cleaners matched" : "Matching cleaners"}
        />
        <ActivityStep
          state={hasBids ? "complete" : hasMatches ? "current" : "pending"}
          label={hasBids ? "Bids received" : "Collecting bids"}
        />
        <ActivityStep state="pending" label="Choose your cleaner" />
      </ol>

      <div className="market-activity-trust">
        <ShieldCheck aria-hidden="true" />
        <span>
          {topRating
            ? `Top matched cleaner rating: ${topRating.toFixed(1)}.`
            : "Cleaner trust signals appear as bids arrive."}
        </span>
      </div>
    </section>
  );
}

function ActivityStep({
  label,
  state,
}: {
  label: string;
  state: "complete" | "current" | "pending";
}) {
  return (
    <li className={`market-activity-step ${state}`}>
      {state === "complete" ? <CheckCircle2 aria-hidden="true" /> : <Circle aria-hidden="true" />}
      <span>{label}</span>
    </li>
  );
}
