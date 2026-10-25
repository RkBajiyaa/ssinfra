import "server-only";
import { FieldValue, Timestamp, type DocumentSnapshot, type Query } from "firebase-admin/firestore";
import { COLLECTIONS, db } from "@/lib/firebase/admin";
import { istDate } from "@/lib/request";
import { LEAD_STATUS_IDS, type LeadStatus } from "@/lib/domain";
import type { LeadFields, LeadMeta } from "./schema";
import { LEADS_PAGE_SIZE, type Lead, type LeadListFilters } from "./types";

/*
 * Every function here assumes the caller has already authorised the request:
 * createLead is public (validated + rate limited by the action), everything
 * else must only be reached after requireAdmin().
 */

const SEARCH_SCAN_LIMIT = 1000;

export function formatLeadNumber(n: number): string {
  return `SSI-${String(n).padStart(5, "0")}`;
}

export async function createLead(
  fields: LeadFields,
  meta: LeadMeta,
): Promise<{ id: string; leadNumber: string; created: boolean }> {
  const firestore = db();
  const leadRef = firestore.collection(COLLECTIONS.leads).doc(meta.idempotencyKey);
  const counterRef = firestore.collection(COLLECTIONS.counters).doc("leads");
  const dayRef = firestore.collection(COLLECTIONS.analyticsDaily).doc(istDate());

  return firestore.runTransaction(async (tx) => {
    const [existing, counter] = await Promise.all([tx.get(leadRef), tx.get(counterRef)]);
    // A retried or double-clicked submission returns the original lead.
    if (existing.exists) {
      return { id: leadRef.id, leadNumber: existing.get("leadNumber") as string, created: false };
    }
    const next = ((counter.get("value") as number | undefined) ?? 0) + 1;
    const leadNumber = formatLeadNumber(next);
    const now = FieldValue.serverTimestamp();

    tx.set(counterRef, { value: next }, { merge: true });
    tx.create(leadRef, {
      leadNumber,
      ...fields,
      packageSlug: meta.packageSlug,
      sourcePage: meta.sourcePage,
      attribution: {
        entryPage: meta.entryPage,
        referrer: meta.referrer,
        utmSource: meta.utmSource,
        utmMedium: meta.utmMedium,
        utmCampaign: meta.utmCampaign,
      },
      status: "new" satisfies LeadStatus,
      internalNotes: null,
      createdAt: now,
      updatedAt: now,
    });
    tx.set(dayRef, { date: istDate(), leads: FieldValue.increment(1) }, { merge: true });
    return { id: leadRef.id, leadNumber, created: true };
  });
}

function toIso(v: unknown): string {
  return v instanceof Timestamp ? v.toDate().toISOString() : new Date(0).toISOString();
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length ? v : null;
}

export function toLead(snap: DocumentSnapshot): Lead {
  const d = snap.data() ?? {};
  const a = (d.attribution ?? {}) as Record<string, unknown>;
  const status = LEAD_STATUS_IDS.includes(d.status) ? (d.status as LeadStatus) : "new";
  return {
    id: snap.id,
    leadNumber: String(d.leadNumber ?? ""),
    fullName: String(d.fullName ?? ""),
    phone: String(d.phone ?? ""),
    businessName: str(d.businessName),
    email: str(d.email),
    requestedService: String(d.requestedService ?? "other"),
    numberOfCourts: typeof d.numberOfCourts === "number" ? d.numberOfCourts : null,
    courtType: str(d.courtType),
    siteType: str(d.siteType),
    flooringRequirements: str(d.flooringRequirements),
    projectCity: String(d.projectCity ?? ""),
    projectState: String(d.projectState ?? ""),
    estimatedBudget: str(d.estimatedBudget),
    expectedTimeline: str(d.expectedTimeline),
    projectDetails: str(d.projectDetails),
    packageSlug: str(d.packageSlug),
    sourcePage: str(d.sourcePage),
    attribution: {
      entryPage: str(a.entryPage),
      referrer: str(a.referrer),
      utmSource: str(a.utmSource),
      utmMedium: str(a.utmMedium),
      utmCampaign: str(a.utmCampaign),
    },
    status,
    internalNotes: str(d.internalNotes),
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
  };
}

/** IST calendar day -> UTC instant at its start. */
function istDayStart(day: string): Date {
  return new Date(`${day}T00:00:00+05:30`);
}

function matchesSearch(lead: Lead, q: string): boolean {
  const needle = q.toLowerCase();
  const digits = q.replace(/\D/g, "");
  return (
    lead.fullName.toLowerCase().includes(needle) ||
    (lead.businessName?.toLowerCase().includes(needle) ?? false) ||
    lead.leadNumber.toLowerCase().includes(needle) ||
    (digits.length >= 3 && lead.phone.replace(/\D/g, "").includes(digits))
  );
}

export async function listLeads(filters: LeadListFilters) {
  let query: Query = db().collection(COLLECTIONS.leads);
  if (filters.status) query = query.where("status", "==", filters.status);
  if (filters.service) query = query.where("requestedService", "==", filters.service);
  if (filters.from) query = query.where("createdAt", ">=", Timestamp.fromDate(istDayStart(filters.from)));
  if (filters.to) {
    const end = istDayStart(filters.to);
    end.setUTCDate(end.getUTCDate() + 1);
    query = query.where("createdAt", "<", Timestamp.fromDate(end));
  }
  query = query.orderBy("createdAt", filters.sort === "oldest" ? "asc" : "desc");

  const page = Math.max(1, filters.page);
  const q = filters.q?.trim();

  if (q) {
    const snap = await query.limit(SEARCH_SCAN_LIMIT).get();
    const matches = snap.docs.map(toLead).filter((l) => matchesSearch(l, q));
    return {
      items: matches.slice((page - 1) * LEADS_PAGE_SIZE, page * LEADS_PAGE_SIZE),
      total: matches.length,
      page,
      pageCount: Math.max(1, Math.ceil(matches.length / LEADS_PAGE_SIZE)),
      truncated: snap.size === SEARCH_SCAN_LIMIT,
    };
  }

  const [countSnap, pageSnap] = await Promise.all([
    query.count().get(),
    query.offset((page - 1) * LEADS_PAGE_SIZE).limit(LEADS_PAGE_SIZE).get(),
  ]);
  const total = countSnap.data().count;
  return {
    items: pageSnap.docs.map(toLead),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE)),
    truncated: false,
  };
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!/^[\w-]{1,128}$/.test(id)) return null;
  const snap = await db().collection(COLLECTIONS.leads).doc(id).get();
  return snap.exists ? toLead(snap) : null;
}

export async function updateLead(
  id: string,
  patch: { status?: LeadStatus; internalNotes?: string | null },
): Promise<boolean> {
  const ref = db().collection(COLLECTIONS.leads).doc(id);
  try {
    await ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
    return true;
  } catch (err) {
    // NOT_FOUND (code 5) means the lead was deleted or the id is wrong.
    if ((err as { code?: number }).code === 5) return false;
    throw err;
  }
}

export async function leadCounts(sinceDay: string) {
  const col = db().collection(COLLECTIONS.leads);
  const [total, fresh, inPeriod] = await Promise.all([
    col.count().get(),
    col.where("status", "==", "new").count().get(),
    col.where("createdAt", ">=", Timestamp.fromDate(istDayStart(sinceDay))).count().get(),
  ]);
  return {
    total: total.data().count,
    new: fresh.data().count,
    inPeriod: inPeriod.data().count,
  };
}

export async function countNewLeads(): Promise<number> {
  const snap = await db().collection(COLLECTIONS.leads).where("status", "==", "new").count().get();
  return snap.data().count;
}

export async function recentLeads(n = 5): Promise<Lead[]> {
  const snap = await db().collection(COLLECTIONS.leads).orderBy("createdAt", "desc").limit(n).get();
  return snap.docs.map(toLead);
}
