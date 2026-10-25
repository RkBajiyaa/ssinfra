import "server-only";
import { createHash } from "node:crypto";

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/**
 * One-way hash for anything derived from IP/user agent. The secret salt
 * means hashes can't be reversed by brute-forcing the IPv4 space.
 */
export function privacyHash(...parts: string[]): string {
  const salt = process.env.ANALYTICS_SALT;
  if (!salt && process.env.NODE_ENV === "production") {
    throw new Error("ANALYTICS_SALT must be set in production");
  }
  return createHash("sha256").update([salt ?? "dev-only-salt", ...parts].join("|")).digest("hex").slice(0, 32);
}

/**
 * Same-origin check for state-changing route handlers. Server Actions get
 * this from Next.js automatically; plain route handlers do not.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Calendar date in India, e.g. "2026-10-25". Analytics days follow the business's timezone. */
export function istDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
