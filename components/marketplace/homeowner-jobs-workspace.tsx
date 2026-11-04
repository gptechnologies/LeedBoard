"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { age, jobTiming, type HomeDetails } from "@/lib/homeowner-view";
import { SimpleJobRequestForm, type JobDraft } from "./simple-job-request-form";
import { discardChanges } from "./homeowner-shell";
export type HomeownerWorkspaceJob = JobDraft & {
  id: string;
  revision: number;
  publicReference: string | null;
  addressLine1: string;
  createdAt: Date | string;
  status: string;
  bidCount: number;
  cleanersNotifiedCount: number;
  mailState: string;
  homeFactsSnapshot?: unknown;
};
export function HomeownerJobsWorkspace({
  jobs,
  home,
  compose = false,
  repost,
  limit = 20,
  hasMore = false,
}: {
  jobs: HomeownerWorkspaceJob[];
  home: HomeDetails | null;
  compose?: boolean;
  repost?: JobDraft | null;
  limit?: number;
  hasMore?: boolean;
}) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [form, setForm] = useState<string | null>(compose ? "new" : null);
  const [open, setOpen] = useState<string | null>(null);
  const [source, setSource] = useState<JobDraft | null>(repost ?? null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    if (window.location.hash.startsWith("#job-"))
      setOpen(window.location.hash.slice(5));
  }, []);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);
  function switchForm(next: string | null) {
    if (form && form !== next) {
      if (
        !discardChanges(
          !!document.querySelector('.hk-job-form[data-dirty="true"]'),
        )
      )
        return;
      window.dispatchEvent(new Event("wellkept:discard"));
    }
    setForm(next);
  }
  async function cancel(id: string) {
    setError("");
    try {
      const r = await fetch(`/customer/jobs/${id}/cancel`, {
        method: "POST",
        headers: { "X-Well-Kept-Client": "1" },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCancelId(null);
      setNotice("Request cancelled.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to cancel.");
    }
  }
  return (
    <section className="hk-page hk-jobs">
      <AnimatePresence initial={false} mode="wait">
        {form === "new" ? (
          <motion.div
            key="request-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.22,
              ease: [0.23, 1, 0.32, 1],
            }}
            style={{ overflow: "hidden", paddingInline: 4, marginInline: -4 }}
          >
            <SimpleJobRequestForm
              home={home}
              source={source}
              onSaved={() => {
                setForm(null);
                setNotice("Request sent to cleaners");
              }}
              onDiscard={() => setForm(null)}
            />
          </motion.div>
        ) : (
          <motion.div key="job-actions" transition={{ duration: 0 }}>
            <header className="hk-heading">
              <h1>Your jobs</h1>
              <p>Post and manage your cleanings.</p>
            </header>
            <button
              className="hk-primary"
              type="button"
              onClick={() => {
                setSource(null);
                switchForm("new");
              }}
            >
              <Plus />
              Post a cleaning job
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {notice && (
        <p className="hk-feedback" role="status">
          {notice}
        </p>
      )}
      <div className="hk-job-list">
        {!jobs.length && !form ? (
          <p className="hk-empty">Your cleaning requests will appear here.</p>
        ) : (
          jobs.map((j) => {
            const expanded = open === j.id;
            const status =
              j.status === "AWARDED"
                ? "Cleaner chosen"
                : j.status === "COMPLETED"
                  ? "Completed"
                  : j.status === "CANCELLED"
                    ? "Cancelled"
                    : j.status === "EXPIRED"
                      ? "Expired"
                      : j.bidCount
                        ? `${j.bidCount} ${j.bidCount === 1 ? "bid" : "bids"}`
                        : "Finding cleaners";
            const facts = j.homeFactsSnapshot as {
              estimatedSquareFeet?: number;
              hasPets?: boolean;
            } | null;
            return (
              <article className="hk-job-card" id={"job-" + j.id} key={j.id}>
                <button
                  className="hk-job-overview"
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={"details-" + j.id}
                  onClick={() => {
                    if (form === j.id) {
                      if (
                        !discardChanges(
                          !!document.querySelector(
                            '.hk-job-form[data-dirty="true"]',
                          ),
                        )
                      )
                        return;
                      window.dispatchEvent(new Event("wellkept:discard"));
                      setForm(null);
                    }
                    setOpen(expanded ? null : j.id);
                  }}
                >
                  <span className="hk-calendar">
                    <CalendarDays />
                  </span>
                  <span className="hk-job-copy">
                    <strong>{jobTiming(j)}</strong>
                    <span>{j.addressLine1 || `ZIP ${j.postalCode}`}</span>
                    <small>Posted {age(j.createdAt)}</small>
                  </span>
                  <span
                    className={`hk-job-badge ${["COMPLETED", "CANCELLED", "EXPIRED"].includes(j.status) ? "is-neutral" : ""}`}
                  >
                    {status}
                  </span>
                  <ChevronRight
                    className={expanded ? "hk-chevron is-open" : "hk-chevron"}
                  />
                </button>
                {expanded && (
                  <div
                    className="hk-job-detail hk-expand"
                    id={"details-" + j.id}
                  >
                    <p>
                      {j.bedroomCount ?? "—"} beds · {j.bathroomCount ?? "—"}{" "}
                      baths
                      {facts?.estimatedSquareFeet
                        ? ` · ${facts.estimatedSquareFeet.toLocaleString()} sq ft`
                        : ""}
                    </p>
                    <p>{j.cleanType?.replaceAll("_", " ").toLowerCase()}</p>
                    {j.notes && <p>{j.notes}</p>}
                    {j.status === "OPEN" && (
                      <p className="hk-muted">
                        {j.cleanersNotifiedCount
                          ? `${j.cleanersNotifiedCount} cleaners contacted.`
                          : j.mailState === "FAILED"
                            ? "Email delivery needs attention. Your request is saved."
                            : j.mailState === "NO_MATCH"
                              ? "We haven’t found a subscribed cleaner for this ZIP yet."
                              : "Finding nearby cleaners."}
                      </p>
                    )}
                    <Link
                      className="hk-primary"
                      href={`/customer/messages?jobId=${j.id}`}
                      replace
                      scroll={false}
                    >
                      {j.bidCount
                        ? `View ${j.bidCount} cleaning ${j.bidCount === 1 ? "bid" : "bids"}`
                        : "View conversations"}
                    </Link>
                    {j.status === "OPEN" ? (
                      <>
                        <button
                          className="hk-text-button"
                          type="button"
                          onClick={() =>
                            switchForm(form === j.id ? null : j.id)
                          }
                        >
                          {form === j.id
                            ? "Cancel editing"
                            : "Edit job details"}
                        </button>
                        {form === j.id && (
                          <SimpleJobRequestForm
                            source={j}
                            edit={{ id: j.id, revision: j.revision }}
                            onSaved={() => {
                              setForm(null);
                              setNotice("Job details saved.");
                            }}
                            onDiscard={() => setForm(null)}
                          />
                        )}
                        {cancelId === j.id ? (
                          <div className="hk-inline-confirm">
                            <strong>Cancel this request?</strong>
                            <div className="hk-button-pair">
                              <button
                                className="hk-outline"
                                onClick={() => setCancelId(null)}
                                type="button"
                              >
                                Keep request
                              </button>
                              <button
                                className="hk-primary"
                                onClick={() => cancel(j.id)}
                                type="button"
                              >
                                Cancel request
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="hk-text-button hk-muted"
                            type="button"
                            onClick={() => setCancelId(j.id)}
                          >
                            Cancel request
                          </button>
                        )}
                      </>
                    ) : (
                      !["AWARDED"].includes(j.status) && (
                        <button
                          className="hk-text-button"
                          type="button"
                          onClick={() => {
                            setSource(j);
                            switchForm("new");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Post again
                        </button>
                      )
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
      {error && (
        <p className="hk-error" role="alert">
          {error}
        </p>
      )}
      {hasMore && (
        <Link
          href={`/customer?limit=${limit + 20}`}
          replace
          scroll={false}
          className="hk-outline"
        >
          Load more jobs
        </Link>
      )}
    </section>
  );
}
