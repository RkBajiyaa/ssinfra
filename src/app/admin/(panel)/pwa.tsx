"use client";

import { useEffect, useState } from "react";
import {
  checkPushSubscriptionAction,
  removePushSubscriptionAction,
  savePushSubscriptionAction,
  sendTestPushAction,
} from "@/lib/admin/actions";
import { buttonClass } from "@/components/ui/button";

const SW_URL = "/admin-sw.js";
const SW_SCOPE = "/admin";

/** Registers the admin service worker. `updateViaCache: none` makes updates ship on next load. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE, updateViaCache: "none" }).catch((err) => {
      console.error("[pwa] service worker registration failed", err);
    });
  }, []);
  return null;
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type PushState = "loading" | "unsupported" | "unconfigured" | "denied" | "off" | "on" | "ios-install";

async function detectPush(ios: boolean, standalone: boolean): Promise<PushState> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "unconfigured";
  // iOS only allows web push for apps added to the Home Screen.
  if (ios && !standalone) return "ios-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return "off";
  // Re-sync in case the server dropped it (e.g. after expiry).
  const known = await checkPushSubscriptionAction(sub.endpoint).catch(() => false);
  if (!known) {
    const res = await savePushSubscriptionAction(sub.toJSON()).catch(() => null);
    return res?.ok ? "on" : "off";
  }
  return "on";
}

/** "This device" card: install the app and turn new-lead notifications on/off. */
export function DeviceSettings() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [push, setPush] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let cancelled = false;
    (async () => {
      const next = await detectPush(ios, standalone);
      if (!cancelled) {
        setInstalled(standalone);
        setIsIos(ios);
        setPush(next);
      }
    })();
    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function enablePush() {
    setBusy(true);
    setMessage(null);
    try {
      // Permission is requested only here, in response to a tap.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush(permission === "denied" ? "denied" : "off");
        setMessage({ ok: false, text: "Notifications weren't allowed." });
        return;
      }
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE, updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        }));
      const res = await savePushSubscriptionAction(sub.toJSON());
      setPush(res.ok ? "on" : "off");
      setMessage({ ok: res.ok, text: res.message });
    } catch (err) {
      console.error("[push] enable failed", err);
      setMessage({ ok: false, text: "Couldn't turn on notifications in this browser." });
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setPush("off");
      setMessage({ ok: true, text: "Notifications are off for this device." });
    } catch {
      setMessage({ ok: false, text: "Couldn't turn notifications off. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    const res = await sendTestPushAction().catch(() => ({ ok: false, message: "Couldn't send a test." }));
    setMessage({ ok: res.ok, text: res.message });
    setBusy(false);
  }

  const pushText: Record<PushState, string> = {
    loading: "Checking this device…",
    unsupported: "This browser doesn't support push notifications. New leads still appear here with a badge.",
    unconfigured: "Push notifications aren't configured on the server yet (VAPID keys missing).",
    denied: "Notifications are blocked for this site. Allow them in your browser's site settings, then reload.",
    off: "Get a notification on this device when a new enquiry arrives.",
    on: "This device gets a notification when a new enquiry arrives.",
    "ios-install": "On iPhone and iPad, add Admin SS Infra to your Home Screen first, then open it from there to turn on notifications.",
  };

  return (
    <section aria-labelledby="device-h" className="border border-line bg-white p-5">
      <h2 id="device-h" className="font-display text-[1.5rem] font-bold text-navy">
        This device
      </h2>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="font-semibold text-navy">App</h3>
          {installed ? (
            <p className="mt-1 text-sm text-muted">Running as an installed app.</p>
          ) : installEvent ? (
            <>
              <p className="mt-1 text-sm text-muted">Install Admin SS Infra for one-tap access from your home screen or desktop.</p>
              <button
                type="button"
                className={buttonClass("dark", "md", "mt-3")}
                onClick={async () => {
                  await installEvent.prompt();
                  const choice = await installEvent.userChoice;
                  if (choice.outcome === "accepted") setInstalled(true);
                  setInstallEvent(null);
                }}
              >
                Install app
              </button>
            </>
          ) : isIos ? (
            <p className="mt-1 text-sm text-muted">In Safari, tap Share, then &ldquo;Add to Home Screen&rdquo;.</p>
          ) : (
            <p className="mt-1 text-sm text-muted">
              Use your browser&rsquo;s menu and choose &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.
            </p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-navy">New-lead notifications</h3>
          <p className="mt-1 text-sm text-muted">{pushText[push]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {push === "off" && (
              <button type="button" disabled={busy} onClick={enablePush} className={buttonClass("dark", "md")}>
                Turn on notifications
              </button>
            )}
            {push === "on" && (
              <>
                <button type="button" disabled={busy} onClick={sendTest} className={buttonClass("outline", "md")}>
                  Send a test
                </button>
                <button type="button" disabled={busy} onClick={disablePush} className={buttonClass("outline", "md")}>
                  Turn off
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {message && (
        <p role="status" className={`mt-4 text-sm font-medium ${message.ok ? "text-ok" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
