"use client";

import { ConversationSender, type ConversationChannel } from "@prisma/client";
import { Check, Send } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import type { ThreadMessage } from "@/lib/conversation";

export function ConversationThread({
  bidId,
  initialMessages,
  chosenAt,
  chosenText,
  conversationRef,
  role,
  smsOnly,
  smsReady,
  disabled,
}: {
  bidId: string;
  initialMessages: ThreadMessage[];
  chosenAt?: string | null;
  chosenText?: string;
  conversationRef?: string;
  role: "customer" | "cleaner";
  smsOnly?: boolean;
  smsReady?: boolean;
  disabled?: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [currentChosenAt, setCurrentChosenAt] = useState(chosenAt);
  const bidNote = initialMessages.find((message) => message.id === `bid-${bidId}`);
  const knownIds = useRef(new Set(initialMessages.map((message) => message.id)));

  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch(`/api/conversations/${bidId}/messages?role=${role}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { messages: ThreadMessage[]; chosenAt: string | null };
        setCurrentChosenAt(data.chosenAt);
        const other = role === "customer" ? ConversationSender.CLEANER : ConversationSender.CUSTOMER;
        if (data.messages.some((message) => message.sender === other && !knownIds.current.has(message.id))) {
          void fetch(`/api/activity/${bidId}/read`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }),
          });
        }
        data.messages.forEach((message) => knownIds.current.add(message.id));
        setMessages(bidNote ? [bidNote, ...data.messages] : data.messages);
      } catch { /* A temporary connection issue should not clear the conversation. */ }
    };
    const interval = window.setInterval(refresh, 7000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [bidId, bidNote, role]);

  const timeline: Array<ThreadMessage & { chosen?: boolean }> = [...messages];
  if (currentChosenAt) timeline.push({
    id: `chosen-${bidId}`, sender: ConversationSender.CUSTOMER, channel: "APP" as ConversationChannel,
    body: chosenText || "Great, I’ve chosen you for this job.", deliveryStatus: null, createdAt: currentChosenAt, chosen: true,
  });
  timeline.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/conversations/${bidId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, role }),
      });
      const result = await response.json().catch(() => null) as { message?: ThreadMessage; error?: string } | null;
      if (result?.message) {
        const sent = result.message;
        knownIds.current.add(sent.id);
        setMessages((current) => current.some((item) => item.id === sent.id) ? current : [...current, sent]);
        setDraft("");
      }
      if (!response.ok) throw new Error(result?.error || "Unable to send message.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send message.");
    } finally { setSending(false); }
  }

  return <div className="wk-unified-conversation">
    <section className="wk-conversation-thread" aria-label="Conversation messages" aria-live="polite">
      {timeline.length ? timeline.map((message, index) => {
        const day = dayLabel(message.createdAt);
        const previousDay = index ? dayLabel(timeline[index - 1].createdAt) : null;
        const isOwnMessage = message.sender === (role === "cleaner" ? ConversationSender.CLEANER : ConversationSender.CUSTOMER);
        return <div className="wk-message-group" key={message.id}>
          {day !== previousDay ? <p className="wk-conversation-day">{day}</p> : null}
          <article className={`wk-chat-line ${isOwnMessage ? "is-customer" : "is-provider"}`}>
            <div>
              <p>{message.body}</p>
              <time dateTime={message.createdAt}>
                {message.chosen ? <>Chosen <Check aria-hidden="true" /> · </> : null}
                {formatTime(message.createdAt)}
                {message.deliveryStatus === "FAILED" ? " · Text failed" : null}
                {message.deliveryStatus === "PENDING" ? " · Sending text" : null}
              </time>
            </div>
          </article>
        </div>;
      }) : <p className="wk-conversation-empty">No messages yet. Start the conversation below.</p>}
    </section>
    <form className="wk-conversation-compose" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={`message-${bidId}`}>Write a message</label>
      <textarea
        id={`message-${bidId}`}
        maxLength={2000}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}
        placeholder={smsOnly && !smsReady ? "SMS will be available when messaging is connected" : "Write a message…"}
        disabled={disabled || (smsOnly && !smsReady)}
        rows={1}
        value={draft}
      />
      <button aria-label="Send message" disabled={disabled || sending || !draft.trim() || Boolean(smsOnly && !smsReady)} type="submit"><Send aria-hidden="true" /><span>Send</span></button>
    </form>
    {error ? <p className="wk-conversation-error" role="alert">{error}</p> : null}
    {smsOnly ? <p className="wk-conversation-channel">{smsReady ? "Replies are sent as texts to this cleaner and appear here." : "Text messaging is not connected yet."}{conversationRef ? ` Text reference: ${conversationRef}` : ""}</p> : null}
    {disabled ? <p className="wk-conversation-channel">This conversation is closed.</p> : null}
  </div>;
}

function formatTime(value: string) { return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }); }
function dayLabel(value: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "America/New_York" });
  const day = formatter.format(new Date(value));
  if (day === formatter.format(new Date())) return "Today";
  const yesterday = new Date(Date.now() - 86400000);
  if (day === formatter.format(yesterday)) return "Yesterday";
  return day;
}
