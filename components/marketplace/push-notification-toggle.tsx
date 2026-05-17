"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function PushNotificationToggle({
  enabled,
  isConfigured,
  latestDelivery,
  publicKey,
  subscriptionCount,
}: {
  enabled: boolean;
  isConfigured: boolean;
  latestDelivery: {
    createdAt: string;
    failureReason: string | null;
    status: string;
  } | null;
  publicKey?: string;
  subscriptionCount: number;
}) {
  const [message, setMessage] = useState("");
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  async function enableNotifications() {
    if (!isSupported) {
      setMessage("Push notifications are not supported in this browser.");
      return;
    }

    if (!publicKey) {
      setMessage("Push notifications are not configured yet.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Notifications were not allowed.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(publicKey),
          userVisibleOnly: true,
        }));

      const response = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Unable to save notification subscription.");
      }

      setIsEnabled(true);
      setMessage("Job alerts are enabled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to enable notifications.");
    } finally {
      setIsSaving(false);
    }
  }

  async function disableNotifications() {
    setIsSaving(true);
    setMessage("");

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();

      await fetch("/api/notifications/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription?.endpoint }),
      });

      await subscription?.unsubscribe();

      setIsEnabled(false);
      setMessage("Job alerts are off.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to turn off notifications.");
    } finally {
      setIsSaving(false);
    }
  }

  async function sendTestNotification() {
    setIsTesting(true);
    setMessage("");

    try {
      const response = await fetch("/api/notifications/push/test", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to send test notification.");
      }

      const result = (await response.json()) as { sent?: number; skipped?: boolean };
      setMessage(
        result.sent && result.sent > 0
          ? "Test notification sent."
          : "No active browser subscription found. Re-enable job alerts on this device.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send test notification.");
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <section className="market-card">
      <div className="market-card__header">
        <div className="stack small">
          <strong>Job alerts</strong>
          <span className="market-card__meta">
            {isEnabled ? "Push notifications enabled" : "Get notified when a nearby job is posted"}
          </span>
        </div>
      </div>
      <p className="market-card__copy">
        Alerts open directly to the job so you can review details and bid quickly.
      </p>
      <div className="push-diagnostics" aria-label="Push notification diagnostics">
        <span className={isSupported ? "ok" : "warn"}>Browser {isSupported ? "supported" : "unsupported"}</span>
        <span className={isConfigured ? "ok" : "warn"}>VAPID {isConfigured ? "configured" : "missing"}</span>
        <span className={subscriptionCount > 0 ? "ok" : "warn"}>
          {subscriptionCount} active {subscriptionCount === 1 ? "subscription" : "subscriptions"}
        </span>
        {latestDelivery ? (
          <span className={latestDelivery.status === "FAILED" ? "warn" : "ok"}>
            Last push: {latestDelivery.status.toLowerCase()}
          </span>
        ) : (
          <span className="warn">No push delivery yet</span>
        )}
      </div>
      {latestDelivery?.failureReason ? (
        <p className="market-card__meta push-diagnostics__failure">
          Last failure: {latestDelivery.failureReason}
        </p>
      ) : null}
      <div className="market-card__actions market-card__actions--start">
        {isEnabled ? (
          <>
            <button
              type="button"
              className="secondary-submit"
              onClick={disableNotifications}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Turn off alerts"}
            </button>
            <button
              type="button"
              className="secondary-submit"
              onClick={sendTestNotification}
              disabled={isTesting}
            >
              {isTesting ? "Sending..." : "Send test"}
            </button>
          </>
        ) : (
          <button type="button" onClick={enableNotifications} disabled={isSaving}>
            {isSaving ? "Saving..." : "Enable job alerts"}
          </button>
        )}
      </div>
      {message ? <p className="market-card__meta" aria-live="polite">{message}</p> : null}
    </section>
  );
}
