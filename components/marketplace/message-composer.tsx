"use client";

import { ArrowUpRight } from "lucide-react";
import { FormEvent, useState } from "react";

export function MessageComposer({ phone }: { phone: string | null }) {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone || !message.trim()) return;
    const separator = /iPad|iPhone|iPod/.test(navigator.userAgent) ? "&" : "?";
    window.location.href = `sms:${phone}${separator}body=${encodeURIComponent(message.trim())}`;
  }

  return (
    <div className="wk-message-handoff">
      <form className="wk-message-composer" onSubmit={handleSubmit}>
        <label>
          <span className="sr-only">SMS message</span>
          <input
            aria-describedby="sms-handoff-hint"
            disabled={!phone}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={phone ? "Write an SMS…" : "SMS unavailable"}
            value={message}
          />
        </label>
        <button aria-label="Open SMS app with message draft" disabled={!phone || !message.trim()} type="submit">
          Open SMS <ArrowUpRight aria-hidden="true" />
        </button>
      </form>
      <p className="wk-message-handoff__hint" id="sms-handoff-hint">
        {phone ? "Opens Messages so you can review and send." : "SMS is available once this cleaner shares a number."}
      </p>
    </div>
  );
}
