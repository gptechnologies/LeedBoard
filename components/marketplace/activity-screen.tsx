"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Home, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { triggerHaptic } from "@/lib/haptics";

export type ActivityConversation = {
  avatar: string;
  href: string;
  id: string;
  name: string;
  preview: string;
  service: string;
  time: string;
  unread?: number;
};

export type ActivityJob = {
  action: string;
  href: string;
  id: string;
  location: string;
  progress: number;
  status: string;
  timing: string;
  title: string;
};

export function ActivityScreen({
  conversations,
  emptyAction,
  jobs,
  jobsLabel = "Open Jobs",
}: {
  conversations: ActivityConversation[];
  emptyAction?: { href: string; label: string };
  jobs: ActivityJob[];
  jobsLabel?: string;
}) {
  const [segment, setSegment] = useState<"updates" | "jobs">("updates");

  useEffect(() => {
    const firstUnread = conversations.find((conversation) => conversation.unread);
    if (!firstUnread) return;

    const key = `wellkept-notified-event-${firstUnread.id}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    triggerHaptic("notification");
  }, [conversations]);

  return (
    <>
      <div className="wk-segmented" role="tablist" aria-label="Activity type">
        <button
          aria-controls="activity-updates-panel"
          id="activity-updates-tab"
          aria-selected={segment === "updates"}
          className={segment === "updates" ? "is-active" : ""}
          onClick={() => {
            setSegment("updates");
            triggerHaptic("selection");
          }}
          role="tab"
          type="button"
        >
          Updates
        </button>
        <button
          aria-controls="activity-jobs-panel"
          id="activity-jobs-tab"
          aria-selected={segment === "jobs"}
          className={segment === "jobs" ? "is-active" : ""}
          onClick={() => {
            setSegment("jobs");
            triggerHaptic("selection");
          }}
          role="tab"
          type="button"
        >
          Jobs
        </button>
      </div>

      <div
        aria-labelledby={segment === "updates" ? "activity-updates-tab" : "activity-jobs-tab"}
        className="wk-activity-pane"
        id={segment === "updates" ? "activity-updates-panel" : "activity-jobs-panel"}
        key={segment}
        role="tabpanel"
      >
        {segment === "updates" ? (
          <section className="wk-activity-section">
            <div className="wk-section-title">
              <h2>Recent updates</h2>
              <span>{conversations.length} items</span>
            </div>
            {conversations.length > 0 ? (
              <div className="wk-conversation-list">
                {conversations.map((conversation) => (
                  <Link
                    className={`wk-conversation-row wk-pressable${conversation.unread ? " is-unread" : ""}`}
                    href={conversation.href}
                    key={conversation.id}
                    onClick={() => triggerHaptic("selection")}
                  >
                    <span className="wk-row-avatar">{conversation.avatar}</span>
                    <span className="wk-row-copy">
                      <strong>{conversation.name}</strong>
                      <small>{conversation.service}</small>
                      <span>{conversation.preview}</span>
                    </span>
                    <span className="wk-row-meta">
                      <time>{conversation.time}</time>
                      {conversation.unread ? <b>{conversation.unread}</b> : null}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyActivity
                action={emptyAction}
                body="Bid and job updates will appear here as they happen."
                icon="message"
                title="No updates yet"
              />
            )}
          </section>
        ) : (
          <section className="wk-activity-section">
            <div className="wk-section-title">
              <h2>{jobsLabel}</h2>
              <span>{jobs.length} active</span>
            </div>
            {jobs.length > 0 ? (
              <div className="wk-job-list">
                {jobs.map((job) => (
                  <Link
                    className="wk-activity-job wk-pressable"
                    href={job.href}
                    key={job.id}
                    onClick={() => triggerHaptic("selection")}
                  >
                    <span className="wk-job-symbol">
                      {job.title.toLowerCase().includes("kitchen") ? (
                        <Sparkles aria-hidden="true" />
                      ) : (
                        <Home aria-hidden="true" />
                      )}
                    </span>
                    <span className="wk-activity-job__copy">
                      <strong>{job.title}</strong>
                      <em>{job.status}</em>
                      <small>{job.timing}</small>
                      <small>{job.location}</small>
                      <span className="wk-job-progress" aria-label={`Job progress: ${job.status}`}>
                        <i className="is-complete"><b aria-hidden="true" /></i>
                        <i className={job.progress >= 50 ? "is-complete" : "is-current"}><b aria-hidden="true" /></i>
                        <i className={job.progress >= 75 ? "is-complete" : job.progress >= 50 ? "is-current" : ""}><b aria-hidden="true" /></i>
                      </span>
                      <span>{job.action}</span>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyActivity
                action={emptyAction}
                body="Your posted and booked jobs will stay organized here."
                icon="calendar"
                title="No active jobs"
              />
            )}
          </section>
        )}
      </div>
    </>
  );
}

function EmptyActivity({
  action,
  body,
  icon,
  title,
}: {
  action?: { href: string; label: string };
  body: string;
  icon: "message" | "calendar";
  title: string;
}) {
  return (
    <div className="wk-activity-empty">
      {icon === "message" ? <MessageCircle aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}
      <strong>{title}</strong>
      <p>{body}</p>
      {action ? <Link className="button-link" href={action.href}>{action.label}</Link> : null}
    </div>
  );
}
