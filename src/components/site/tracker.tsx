"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const ATTRIBUTION_KEY = "ssi_attribution";

export type Attribution = {
  entryPage: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

/** First-touch attribution for this browsing session; read by the quote form. */
export function readAttribution(): Partial<Attribution> {
  try {
    return JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) ?? "{}") as Partial<Attribution>;
  } catch {
    return {};
  }
}

function captureAttribution() {
  try {
    if (sessionStorage.getItem(ATTRIBUTION_KEY)) return;
    const url = new URL(window.location.href);
    const external = document.referrer && new URL(document.referrer).host !== url.host ? document.referrer : "";
    const value: Attribution = {
      entryPage: url.pathname,
      referrer: external.slice(0, 200),
      utmSource: url.searchParams.get("utm_source")?.slice(0, 100) ?? "",
      utmMedium: url.searchParams.get("utm_medium")?.slice(0, 100) ?? "",
      utmCampaign: url.searchParams.get("utm_campaign")?.slice(0, 100) ?? "",
    };
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value));
  } catch {
    // Storage blocked (private mode etc.): attribution is optional.
  }
}

let firstView = true;
let lastSentPath: string | null = null;

/**
 * Sends one page-view beacon per public page navigation. Fire-and-forget:
 * it never blocks rendering and failures are invisible to visitors.
 */
export function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    captureAttribution();
  }, []);

  useEffect(() => {
    // One beacon per navigation, even if the effect re-runs (React Strict Mode in development).
    if (lastSentPath === pathname) return;
    lastSentPath = pathname;
    // Respect Global Privacy Control.
    if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    // Credit the external referrer once per landing, not on every internal navigation.
    const referrer = firstView ? (readAttribution().referrer ?? "") : "";
    firstView = false;
    const body = JSON.stringify({ p: pathname, r: referrer || undefined });
    try {
      if (!navigator.sendBeacon?.("/api/track", body)) {
        void fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    } catch {
      // Ignore: analytics must never affect the page.
    }
  }, [pathname]);

  return null;
}
