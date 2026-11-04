"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
export type HomeownerConversation = {
  id: string;
  jobId: string;
  name: string;
  avatar: string;
  price: string;
  timing: string;
  preview: string;
  time: string;
  unread: boolean;
  status: string | null;
};
export function HomeownerMessagesInbox({
  conversations,
  jobs,
  selectedJob,
}: {
  conversations: HomeownerConversation[];
  jobs: { id: string; label: string }[];
  selectedJob: string;
}) {
  const router = useRouter();
  const p = useSearchParams();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const t = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);
  return (
    <section className="hk-page hk-messages">
      <header className="hk-heading">
        <h1>Messages</h1>
        <p>Cleaner bids and conversations.</p>
      </header>
      <label className="hk-job-filter">
        <span className="sr-only">Filter conversations by cleaning job</span>
        <select
          value={selectedJob}
          onChange={(e) =>
            router.replace(
              e.target.value
                ? "/customer/messages?jobId=" +
                    encodeURIComponent(e.target.value)
                : "/customer/messages",
              { scroll: false },
            )
          }
        >
          <option value="">All jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.label}
            </option>
          ))}
        </select>
      </label>
      <section className="hk-inbox" aria-label="Cleaner bids and conversations">
        {conversations.length ? (
          conversations.map((c) => (
            <Link
              className={`hk-conversation-row${c.unread ? " is-unread" : ""}`}
              key={c.id}
              href={`/customer/messages/${c.id}?jobId=${selectedJob || "all"}`}
              scroll={false}
            >
              <span className="hk-avatar" aria-hidden="true">
                {c.avatar}
              </span>
              <span className="hk-row-copy">
                <strong>{c.name}</strong>
                <span className="hk-row-offer">
                  {c.price} · {c.timing}
                </span>
                <span className="hk-row-preview">
                  {c.status ? `${c.status} · ` : ""}
                  {c.preview}
                </span>
              </span>
              <span className="hk-row-meta">
                <time>{c.time}</time>
                {c.unread && <i aria-label="Unread" />}
              </span>
            </Link>
          ))
        ) : (
          <p className="hk-empty">
            {selectedJob
              ? "Bids for this request will appear here."
              : "Cleaner bids and conversations will appear here."}
          </p>
        )}
      </section>
    </section>
  );
}
