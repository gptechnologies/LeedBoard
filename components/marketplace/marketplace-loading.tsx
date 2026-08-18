import { Skeleton } from "@/components/ui/skeleton";

export function MarketplaceLoading({ cards = 2, title = "Loading" }: { cards?: number; title?: string }) {
  return (
    <div className="wk-app-screen" aria-busy="true" aria-label={title}>
      <div className="wk-loading-header">
        <Skeleton className="wk-loading-avatar" />
        <Skeleton className="wk-loading-title" />
        <Skeleton className="wk-loading-action" />
      </div>
      <div className="wk-screen-content wk-loading-stack">
        {Array.from({ length: cards }, (_, index) => (
          <section className="wk-loading-card" key={index} aria-hidden="true">
            <div className="wk-loading-card__topline">
              <Skeleton className="wk-loading-icon" />
              <div>
                <Skeleton className="wk-loading-line wk-loading-line--strong" />
                <Skeleton className="wk-loading-line wk-loading-line--short" />
              </div>
            </div>
            <Skeleton className="wk-loading-media" />
            <div className="wk-loading-row">
              <Skeleton className="wk-loading-chip" />
              <Skeleton className="wk-loading-chip" />
              <Skeleton className="wk-loading-chip" />
            </div>
            <Skeleton className="wk-loading-button" />
          </section>
        ))}
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}
