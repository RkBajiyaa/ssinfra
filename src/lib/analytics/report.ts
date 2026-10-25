import "server-only";
import { COLLECTIONS, db } from "@/lib/firebase/admin";
import { istDate } from "@/lib/request";

export type DayStat = { date: string; pageviews: number; visitors: number; leads: number };

export type AnalyticsReport = {
  days: DayStat[]; // every day in range, zero-filled, oldest first
  totals: { pageviews: number; visitors: number; leads: number };
  topPages: { path: string; views: number }[];
  topSources: { host: string; views: number }[];
  allTime: { pageviews: number; visitorDays: number };
};

export const PERIODS = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "90 days", days: 90 },
] as const;
export type PeriodId = (typeof PERIODS)[number]["id"];

/** Inclusive list of IST dates ending today. */
export function dayRange(days: number, today = new Date()): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push(istDate(new Date(today.getTime() - i * 86_400_000)));
  }
  return out;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function addMap(target: Map<string, number>, src: unknown) {
  if (!src || typeof src !== "object") return;
  for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
    target.set(k, (target.get(k) ?? 0) + num(v));
  }
}

const top = (m: Map<string, number>, n: number) =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

export async function getAnalyticsReport(periodDays: number): Promise<AnalyticsReport> {
  const range = dayRange(periodDays);
  const firestore = db();
  const [snap, totals] = await Promise.all([
    firestore.collection(COLLECTIONS.analyticsDaily).where("date", ">=", range[0]).get(),
    firestore.collection(COLLECTIONS.counters).doc("analytics").get(),
  ]);

  const byDate = new Map(snap.docs.map((d) => [d.id, d.data()]));
  const paths = new Map<string, number>();
  const sources = new Map<string, number>();

  const days: DayStat[] = range.map((date) => {
    const d = byDate.get(date);
    addMap(paths, d?.paths);
    addMap(sources, d?.sources);
    return { date, pageviews: num(d?.pageviews), visitors: num(d?.visitors), leads: num(d?.leads) };
  });

  return {
    days,
    totals: days.reduce(
      (acc, d) => ({
        pageviews: acc.pageviews + d.pageviews,
        visitors: acc.visitors + d.visitors,
        leads: acc.leads + d.leads,
      }),
      { pageviews: 0, visitors: 0, leads: 0 },
    ),
    topPages: top(paths, 6).map(([path, views]) => ({ path, views })),
    topSources: top(sources, 5).map(([host, views]) => ({ host, views })),
    allTime: { pageviews: num(totals.get("pageviews")), visitorDays: num(totals.get("visitorDays")) },
  };
}
