"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

export type HomeownerConversation = {
  avatar: string;
  href: string;
  id: string;
  name: string;
  preview: string;
  status: string;
  statusTone: "new" | "chosen" | "sent";
  time: string;
};

export function HomeownerMessagesInbox({ conversations }: { conversations: HomeownerConversation[] }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.name} ${conversation.preview} ${conversation.status}`.toLowerCase().includes(needle),
    );
  }, [conversations, query]);

  function toggleSearch() {
    setSearchOpen((open) => {
      if (!open) window.requestAnimationFrame(() => inputRef.current?.focus());
      if (open) setQuery("");
      return !open;
    });
  }

  return (
    <>
      <div className="wk-messages-title-row">
        <h1>Messages</h1>
        <button aria-expanded={searchOpen} aria-label={searchOpen ? "Close search" : "Search messages"} onClick={toggleSearch} type="button">
          {searchOpen ? <X aria-hidden="true" /> : <Search aria-hidden="true" />}
        </button>
      </div>

      {searchOpen ? (
        <label className="wk-messages-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search conversations</span>
          <input ref={inputRef} onChange={(event) => setQuery(event.target.value)} placeholder="Search cleaners" type="search" value={query} />
        </label>
      ) : null}

      <section className="wk-messages-list" aria-label="Conversations">
        {visible.length > 0 ? visible.map((conversation) => (
          <Link className="wk-message-row wk-pressable" href={conversation.href} key={conversation.id}>
            <span className="wk-message-row__avatar" aria-hidden="true">{conversation.avatar}</span>
            <span className="wk-message-row__copy">
              <span className="wk-message-row__name">
                <strong>{conversation.name}</strong>
                <em className={`is-${conversation.statusTone}`}>{conversation.status}</em>
              </span>
              <span>{conversation.preview}</span>
            </span>
            <span className="wk-message-row__meta">
              <time>{conversation.time}</time>
              <i aria-hidden="true">›</i>
            </span>
          </Link>
        )) : (
          <div className="wk-messages-empty">
            <strong>{query ? "No matching conversations" : "No messages yet"}</strong>
            <p>{query ? "Try a cleaner’s name or part of a message." : "Cleaner replies and job conversations will appear here."}</p>
          </div>
        )}
      </section>
    </>
  );
}
