"use client";

import { useState } from "react";

export function QuickReplyActions({ replies }: { replies: string[] }) {
  const [copiedReply, setCopiedReply] = useState("");

  async function copyReply(reply: string) {
    try {
      await navigator.clipboard.writeText(reply);
      setCopiedReply(reply);
    } catch {
      setCopiedReply("");
    }
  }

  return (
    <div className="coordination-quick-replies">
      <div className="coordination-quick-replies__header">
        <strong>Quick coordination</strong>
        <span aria-live="polite">{copiedReply ? "Copied" : "Tap to copy"}</span>
      </div>
      <div className="coordination-quick-replies__grid">
        {replies.map((reply) => (
          <button key={reply} type="button" onClick={() => copyReply(reply)}>
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
