"use client";

import { Paperclip, Send } from "lucide-react";
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
    <form className="wk-message-composer" onSubmit={handleSubmit}>
      <button aria-label="Attach a file" disabled title="Attachments are not available yet" type="button"><Paperclip aria-hidden="true" /></button>
      <label>
        <span className="sr-only">Message</span>
        <input disabled={!phone} onChange={(event) => setMessage(event.target.value)} placeholder={phone ? "Message…" : "Messaging unavailable"} value={message} />
      </label>
      <button aria-label="Send message" disabled={!phone || !message.trim()} type="submit"><Send aria-hidden="true" /></button>
    </form>
  );
}
