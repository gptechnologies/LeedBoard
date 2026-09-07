"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const RESET_DELAY_MS = 8000;

export function InteractionFeedback() {
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const timeoutRef = useRef<number | null>(null);
  const activeFormRef = useRef<HTMLFormElement | null>(null);
  const activeSubmitterRef = useRef<HTMLElement | null>(null);

  const resetFeedback = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    delete document.body.dataset.wkNavigating;
    setMessage("");

    if (activeFormRef.current) {
      delete activeFormRef.current.dataset.wkSubmitting;
      activeFormRef.current.removeAttribute("aria-busy");
    }
    activeSubmitterRef.current?.removeAttribute("data-wk-submit-pending");
    activeSubmitterRef.current?.removeAttribute("aria-disabled");
    activeFormRef.current = null;
    activeSubmitterRef.current = null;
  }, []);

  useEffect(() => {
    resetFeedback();
  }, [pathname, resetFeedback]);

  useEffect(() => {
    function scheduleReset() {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(resetFeedback, RESET_DELAY_MS);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (`${destination.pathname}${destination.search}` === `${window.location.pathname}${window.location.search}`) return;

      document.body.dataset.wkNavigating = "true";
      setMessage(`Opening ${anchor.getAttribute("aria-label") || anchor.textContent?.trim() || "next screen"}`);
      scheduleReset();
    }

    function handleSubmit(event: SubmitEvent) {
      if (event.defaultPrevented) return;
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
      activeFormRef.current = form;
      activeSubmitterRef.current = submitter;
      form.dataset.wkSubmitting = "true";
      form.setAttribute("aria-busy", "true");
      submitter?.setAttribute("data-wk-submit-pending", "true");
      submitter?.setAttribute("aria-disabled", "true");
      document.body.dataset.wkNavigating = "true";
      setMessage(getPendingMessage(submitter));
      scheduleReset();
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    window.addEventListener("pageshow", resetFeedback);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("submit", handleSubmit);
      window.removeEventListener("pageshow", resetFeedback);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [resetFeedback]);

  return (
    <div className="wk-global-progress" data-visible={message ? "true" : "false"} role="status" aria-live="polite">
      <span aria-hidden="true" />
      <span className="sr-only">{message}</span>
    </div>
  );
}

function getPendingMessage(submitter: HTMLElement | null) {
  const label = submitter?.textContent?.trim().toLowerCase() ?? "";
  if (label.includes("save") || label.includes("update")) return "Saving changes";
  if (label.includes("delete") || label.includes("cancel")) return "Updating your job";
  if (label.includes("bid") || label.includes("offer")) return "Sending your offer";
  if (label.includes("complete")) return "Marking the job complete";
  return "Working on it";
}
