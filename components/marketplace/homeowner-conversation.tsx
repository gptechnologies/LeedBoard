"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MoreHorizontal,
  CalendarDays,
  Clock3,
  MapPin,
  Check,
  Plus,
  Send,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { day, clock } from "@/lib/homeowner-view";
import type { ThreadMessage } from "@/lib/conversation";
export type ConversationView = {
  id: string;
  jobId: string;
  name: string;
  price: string;
  date: string | null;
  arrival: string | null;
  address: string;
  notes: string | null;
  scope: string;
  bidVersion: string;
  canChoose: boolean;
  accepted: boolean;
  completed: boolean;
  closedReason: string | null;
  phone: string | null;
  firstName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  email: string;
  hasPhone: boolean;
};
export function HomeownerConversation({
  view: v,
  initialMessages,
  backHref,
}: {
  view: ConversationView;
  initialMessages: ThreadMessage[];
  backHref: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newMessage, setNewMessage] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const first = useRef(true);
  const viewport = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const resize = () =>
      viewport.current?.style.setProperty(
        "--hk-vh",
        `${window.visualViewport?.height ?? window.innerHeight}px`,
      );
    resize();
    window.visualViewport?.addEventListener("resize", resize);
    return () => window.visualViewport?.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    setDraft(sessionStorage.getItem("hk-message:" + v.id) ?? "");
  }, [v.id]);
  useEffect(() => {
    const s = scroll.current;
    if (s && (first.current || nearBottom.current)) {
      s.scrollTop = s.scrollHeight;
      first.current = false;
      setNewMessage(false);
    } else if (s) setNewMessage(true);
  }, [messages]);
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch(
          `/api/conversations/${v.id}/messages?role=customer`,
          { cache: "no-store" },
        );
        if (!r.ok) return;
        const d = (await r.json()) as {
          messages: ThreadMessage[];
          chosenAt: string | null;
          closedReason: string | null;
        };
        setMessages((current) => {
          const real = new Set(d.messages.map((m) => m.id));
          const synthetic = initialMessages.filter(
            (m) => m.id.startsWith("bid-") || m.id.startsWith("question-"),
          );
          const next = [...synthetic, ...d.messages];
          return JSON.stringify(current) === JSON.stringify(next)
            ? current
            : next;
        });
        if (
          !!d.chosenAt !== v.accepted ||
          (!!d.closedReason !== !!v.closedReason && !v.completed)
        )
          router.refresh();
        void fetch(`/api/activity/${v.id}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "customer" }),
        });
      } catch {}
    };
    const t = setInterval(refresh, 5000);
    const t2 = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 15000);
    return () => {
      clearInterval(t);
      clearInterval(t2);
    };
  }, [v.id, v.accepted, v.closedReason, router, initialMessages]);
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const r = await fetch(`/api/conversations/${v.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "customer", body: draft.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      nearBottom.current = true;
      setMessages((m) => [...m, d.message]);
      setDraft("");
      sessionStorage.removeItem("hk-message:" + v.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send. Try again.");
    } finally {
      setSending(false);
    }
  }
  async function choose(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      f.set("bidId", v.id);
      f.set("bidVersion", v.bidVersion);
      const r = await fetch(`/customer/jobs/${v.jobId}/accept-bid`, {
        method: "POST",
        headers: { "X-Well-Kept-Client": "1" },
        body: f,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setConfirm(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to confirm.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="hk-thread" ref={viewport}>
      <header className="hk-thread-header">
        <Link href={backHref} aria-label="Back to Messages" scroll={false}>
          <ArrowLeft />
        </Link>
        <span className="hk-avatar" aria-hidden="true">
          {v.name.charAt(0)}
        </span>
        <div>
          <h1>{v.name}</h1>
          <p>Cleaning bid · {day(v.date)}</p>
        </div>
        {v.phone && (
          <a href={`tel:${v.phone}`} aria-label="Call cleaner">
            <Phone />
          </a>
        )}
        <details className="hk-thread-menu">
          <summary aria-label="Conversation actions">
            <MoreHorizontal />
          </summary>
          <Link href={`/customer#job-${v.jobId}`}>View cleaning job</Link>
        </details>
      </header>
      <section className="hk-thread-bid">
        <div className="hk-bid-overview">
          <img
            src="/images/home-cleaning-job.png"
            alt=""
            className="hk-bid-thumb"
          />
          <div className="hk-bid-facts">
            <strong>{v.name.split(" ")[0].replace(/[’']s$/, "")}’s bid</strong>
            <b>{v.price}</b>
            <span>
              <CalendarDays />
              {day(v.date)}
            </span>
            <span>
              <Clock3 />
              {clock(v.arrival) || "Time to confirm"}
            </span>
            <span>
              <MapPin />
              {v.address}
            </span>
          </div>
          <div className="hk-bid-actions">
            {v.accepted ? (
              <span className="hk-confirmed">
                <Check />
                Cleaner confirmed
              </span>
            ) : v.canChoose ? (
              <button
                className="hk-primary"
                onClick={() => {
                  setConfirm(!confirm);
                  setError("");
                }}
                type="button"
              >
                <Check />
                Choose cleaner
              </button>
            ) : (
              <span className="hk-muted">
                {v.closedReason ?? "Price to confirm"}
              </span>
            )}
            <button
              className="hk-outline"
              onClick={() => setDetails(!details)}
              aria-expanded={details}
              type="button"
            >
              {details ? "Hide details" : "View details"}
            </button>
          </div>
        </div>
        {details && (
          <div className="hk-bid-detail hk-expand">
            <p>{v.scope}</p>
            {v.notes && <p>{v.notes}</p>}
            <p>Payment is arranged directly.</p>
          </div>
        )}
        {confirm && !v.accepted && (
          <form className="hk-confirm-panel hk-expand" onSubmit={choose}>
            <h2>Confirm {v.name}?</h2>
            <p>
              {v.price} · {day(v.date)} · {clock(v.arrival)}
            </p>
            <div className="hk-form-grid">
              <label className="hk-field">
                First name
                <input
                  name="firstName"
                  defaultValue={v.firstName}
                  autoComplete="given-name"
                  required
                  maxLength={80}
                />
              </label>
              <label className="hk-field">
                Street address
                <input
                  name="addressLine1"
                  defaultValue={v.street}
                  autoComplete="street-address"
                  required
                  maxLength={250}
                />
              </label>
            </div>
            <div className="hk-form-grid">
              <label className="hk-field">
                City
                <input
                  name="city"
                  defaultValue={v.city}
                  autoComplete="address-level2"
                  required
                />
              </label>
              <label className="hk-field">
                State
                <input
                  name="state"
                  defaultValue={v.state}
                  autoComplete="address-level1"
                  required
                />
              </label>
            </div>
            <p className="hk-muted">
              Only this cleaner receives your name, {v.email}, address
              {v.hasPhone ? ", saved phone number" : ""}, and saved entry
              instructions.
            </p>
            <div className="hk-button-pair">
              <button
                className="hk-outline"
                onClick={() => setConfirm(false)}
                type="button"
              >
                Keep reviewing
              </button>
              <button className="hk-primary" type="submit" disabled={busy}>
                {busy ? "Confirming…" : "Confirm and share details"}
              </button>
            </div>
          </form>
        )}
      </section>
      <div
        className="hk-chat-scroll"
        ref={scroll}
        role="log"
        aria-label="Conversation messages"
        onScroll={() => {
          const s = scroll.current;
          if (s)
            nearBottom.current =
              s.scrollHeight - s.scrollTop - s.clientHeight < 100;
          if (nearBottom.current) setNewMessage(false);
        }}
      >
        {!messages.length ? (
          <p className="hk-chat-empty">
            Ask a question or choose this cleaner.
          </p>
        ) : (
          messages.map((m, i) => {
            const own = m.sender === "CUSTOMER";
            const date = new Date(m.createdAt);
            const previous = i ? new Date(messages[i - 1].createdAt) : null;
            return (
              <div key={m.id}>
                {(!previous ||
                  previous.toDateString() !== date.toDateString()) && (
                  <p className="hk-chat-date">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
                <div
                  className={`hk-chat-line ${own ? "is-own" : "is-incoming"}`}
                >
                  {!own && (
                    <span
                      className="hk-avatar hk-avatar-small"
                      aria-hidden="true"
                    >
                      {v.name.charAt(0)}
                    </span>
                  )}
                  <div>
                    <p className="hk-bubble">{m.body}</p>
                    <time dateTime={m.createdAt}>
                      {date.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {own &&
                        ` · ${m.deliveryStatus === "PENDING" ? "Pending privacy review" : m.deliveryStatus === "FAILED" ? "Not sent" : m.deliveryStatus === "DELIVERED" ? "Delivered" : "Sent"}`}
                    </time>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {newMessage && (
        <button
          className="hk-new-message"
          onClick={() => {
            const s = scroll.current;
            if (s) s.scrollTop = s.scrollHeight;
            nearBottom.current = true;
            setNewMessage(false);
          }}
          type="button"
        >
          New message <ChevronDown />
        </button>
      )}
      {error && (
        <p className="hk-error" role="alert">
          {error}
        </p>
      )}
      {!v.accepted && !v.closedReason && (
        <p className="hk-privacy-note">
          Your replies are reviewed to keep personal details private.
        </p>
      )}
      <form className="hk-composer" onSubmit={send}>
        <button
          className="hk-composer-more"
          type="button"
          aria-label="View job and bid details"
          aria-expanded={details}
          onClick={() => setDetails(!details)}
        >
          <Plus />
        </button>
        <textarea
          ref={input}
          aria-label="Write a message"
          placeholder={v.closedReason ?? "Write a message…"}
          rows={1}
          maxLength={2000}
          value={draft}
          disabled={!!v.closedReason}
          onChange={(e) => {
            setDraft(e.target.value);
            sessionStorage.setItem("hk-message:" + v.id, e.target.value);
          }}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          className="hk-send"
          type="submit"
          aria-label="Send message"
          disabled={sending || !draft.trim() || !!v.closedReason}
        >
          <Send />
        </button>
      </form>
    </div>
  );
}
