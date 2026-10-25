import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS, db } from "@/lib/firebase/admin";
import { istDate, privacyHash } from "@/lib/request";
import { TRACKED_PATHS } from "./paths";

/*
 * Metric definitions (also shown on the dashboard):
 *  - Page view: one public page load or client-side navigation by a non-bot browser.
 *  - Visitor: a distinct (IP + browser) pair within one IST calendar day, identified
 *    only by a salted one-way hash that changes daily. No cookies, nothing stored on
 *    the device, no raw IPs stored. Multi-day totals are the sum of daily visitors
 *    ("visitor-days"), so one person visiting on 3 days counts 3 times.
 */

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|curl|wget|python|httpclient|java\/|go-http/i;
const MAX_VIEWS_PER_VISITOR_PER_DAY = 100;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}

export function normalizePath(raw: string): string | null {
  let path: string;
  try {
    path = new URL(raw, "http://x").pathname;
  } catch {
    return null;
  }
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return (TRACKED_PATHS as readonly string[]).includes(path) ? path : null;
}

/** External referrer host only; internal navigation isn't a traffic source. */
export function referrerHost(referrer: string | undefined, ownHost: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (!/^[a-z0-9.-]{1,60}$/.test(host)) return null;
    if (ownHost && host === ownHost.replace(/^www\./, "").split(":")[0]) return null;
    return host;
  } catch {
    return null;
  }
}

export async function recordPageview(input: {
  path: string;
  referrerHost: string | null;
  ip: string;
  userAgent: string;
}): Promise<"counted" | "capped"> {
  const day = istDate();
  const firestore = db();
  const dayRef = firestore.collection(COLLECTIONS.analyticsDaily).doc(day);
  const visitorRef = dayRef.collection("visitors").doc(privacyHash("visitor", day, input.ip, input.userAgent));
  const totalsRef = firestore.collection(COLLECTIONS.counters).doc("analytics");

  // Only the per-visitor doc is transactional (dedupe + daily cap). Aggregates use
  // atomic increments outside the transaction, so concurrent visits never queue
  // behind a lock on the shared day/totals documents.
  const outcome = await firestore.runTransaction(async (tx) => {
    const visitor = await tx.get(visitorRef);
    const views = (visitor.get("views") as number | undefined) ?? 0;
    if (views >= MAX_VIEWS_PER_VISITOR_PER_DAY) return "capped" as const;
    tx.set(visitorRef, {
      views: views + 1,
      // Lets a Firestore TTL policy purge per-visitor docs after 2 days.
      expireAt: Timestamp.fromMillis(Date.now() + 2 * 86_400_000),
    });
    return visitor.exists ? ("repeat" as const) : ("new" as const);
  });
  if (outcome === "capped") return "capped";

  const isNewVisitor = outcome === "new";
  const batch = firestore.batch();
  batch.set(
    dayRef,
    {
      date: day,
      pageviews: FieldValue.increment(1),
      ...(isNewVisitor ? { visitors: FieldValue.increment(1) } : {}),
      paths: { [input.path]: FieldValue.increment(1) },
      ...(input.referrerHost ? { sources: { [input.referrerHost]: FieldValue.increment(1) } } : {}),
    },
    { merge: true },
  );
  batch.set(
    totalsRef,
    {
      pageviews: FieldValue.increment(1),
      ...(isNewVisitor ? { visitorDays: FieldValue.increment(1) } : {}),
    },
    { merge: true },
  );
  await batch.commit();
  return "counted";
}
