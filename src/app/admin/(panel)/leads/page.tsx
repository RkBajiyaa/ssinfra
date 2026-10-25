import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { logFirebaseError } from "@/lib/firebase/errors";
import { listLeads } from "@/lib/leads/repo";
import { LEAD_STATUSES, LEAD_STATUS_IDS, SERVICES, SERVICE_IDS, serviceShort } from "@/lib/domain";
import { formatPhone } from "@/lib/phone";
import type { LeadListFilters } from "@/lib/leads/types";
import { AdminTitle, SetupNotice, Skeleton, StatusBadge, formatDateTime } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { ChevronIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Leads" };

type SP = PageProps<"/admin/leads">["searchParams"];

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const filtersSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(LEAD_STATUS_IDS).optional().catch(undefined),
  service: z.enum(SERVICE_IDS).optional().catch(undefined),
  from: day.optional().catch(undefined),
  to: day.optional().catch(undefined),
  sort: z.enum(["newest", "oldest"]).catch("newest"),
  page: z.coerce.number().int().min(1).max(500).catch(1),
});

async function readFilters(searchParams: SP): Promise<LeadListFilters> {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  return filtersSchema.parse({
    q: first(sp.q),
    status: first(sp.status),
    service: first(sp.service),
    from: first(sp.from),
    to: first(sp.to),
    sort: first(sp.sort),
    page: first(sp.page),
  });
}

function hrefWith(filters: LeadListFilters, patch: Partial<LeadListFilters>) {
  const merged = { ...filters, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === "" || (k === "page" && v === 1) || (k === "sort" && v === "newest")) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return `/admin/leads${qs ? `?${qs}` : ""}`;
}

export default function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  return (
    <>
      <AdminTitle title="Leads" />
      <Suspense fallback={<Skeleton className="mt-6 h-40" />}>
        <Filters searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<ListSkeleton />}>
        <LeadList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Filters({ searchParams }: { searchParams: SP }) {
  const f = await readFilters(searchParams);
  const field = "mt-1 block min-h-11 w-full rounded-[3px] border border-line bg-white px-3 text-[0.95rem]";
  const active = Boolean(f.q || f.status || f.service || f.from || f.to || f.sort !== "newest");
  return (
    <form method="get" action="/admin/leads" role="search" className="mt-6 border border-line bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <label className="text-sm font-semibold text-navy sm:col-span-2 lg:col-span-1">
          Search
          <input name="q" type="search" defaultValue={f.q} placeholder="Name, phone, business or lead ID" className={field} />
        </label>
        <label className="text-sm font-semibold text-navy">
          Status
          <select name="status" defaultValue={f.status ?? ""} className={field}>
            <option value="">Any status</option>
            {LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-navy">
          Service
          <select name="service" defaultValue={f.service ?? ""} className={field}>
            <option value="">Any service</option>
            {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.short}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="text-sm font-semibold text-navy">
          From
          <input name="from" type="date" defaultValue={f.from} className={field} />
        </label>
        <label className="text-sm font-semibold text-navy">
          To
          <input name="to" type="date" defaultValue={f.to} className={field} />
        </label>
        <label className="col-span-2 text-sm font-semibold text-navy lg:col-span-1">
          Sort
          <select name="sort" defaultValue={f.sort} className={field}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        <div className="col-span-2 flex items-end gap-2 lg:col-span-1">
          <button type="submit" className={buttonClass("dark", "md", "flex-1 lg:flex-none")}>
            Apply
          </button>
          {active && (
            <Link href="/admin/leads" className={buttonClass("outline", "md", "flex-1 lg:flex-none")}>
              Clear
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}

async function LeadList({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const filters = await readFilters(searchParams);
  let result;
  try {
    result = await listLeads(filters);
  } catch (err) {
    const kind = logFirebaseError("admin leads", err);
    return (
      <div className="mt-6">
        <SetupNotice kind={kind} />
      </div>
    );
  }
  const filtered = Boolean(filters.q || filters.status || filters.service || filters.from || filters.to);

  if (result.total === 0) {
    return (
      <div className="mt-6 border border-dashed border-line bg-white px-6 py-14 text-center">
        <p className="font-display text-2xl font-semibold text-navy">{filtered ? "No leads match these filters" : "No leads yet"}</p>
        <p className="mx-auto mt-2 max-w-md text-muted">
          {filtered
            ? "Try a different search or clear the filters."
            : "Enquiries sent through the website's quote form will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-muted" aria-live="polite">
        {result.total} {result.total === 1 ? "lead" : "leads"}
        {result.truncated && " (search covers the 1,000 most recent matching leads)"}
      </p>

      {/* Phone: cards */}
      <ul className="mt-3 grid gap-3 md:hidden">
        {result.items.map((l) => (
          <li key={l.id}>
            <Link href={`/admin/leads/${l.id}`} className="block border border-line bg-white p-4 active:bg-paper">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy">{l.fullName}</p>
                  {l.businessName && <p className="truncate text-sm text-muted">{l.businessName}</p>}
                </div>
                <StatusBadge status={l.status} />
              </div>
              <p className="mt-2 text-sm text-char">
                {serviceShort(l.requestedService)}, {l.projectCity}, {l.projectState}
              </p>
              <p className="mt-1 flex justify-between text-xs text-muted">
                <span>{l.leadNumber}</span>
                <span>{formatDateTime(l.createdAt)}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablet and desktop: table */}
      <div className="mt-3 hidden overflow-x-auto border border-line bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Lead</th>
              <th scope="col" className="px-4 py-3 font-semibold">Contact</th>
              <th scope="col" className="px-4 py-3 font-semibold">Service</th>
              <th scope="col" className="px-4 py-3 font-semibold">Location</th>
              <th scope="col" className="px-4 py-3 font-semibold">Received</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {result.items.map((l) => (
              <tr key={l.id} className="relative hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${l.id}`} className="font-semibold text-navy after:absolute after:inset-0">
                    {l.fullName}
                  </Link>
                  <span className="block text-xs text-muted">{l.leadNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="block whitespace-nowrap">{formatPhone(l.phone)}</span>
                  {l.businessName && <span className="block max-w-48 truncate text-xs text-muted">{l.businessName}</span>}
                </td>
                <td className="px-4 py-3">{serviceShort(l.requestedService)}</td>
                <td className="px-4 py-3">{l.projectCity}, {l.projectState}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
          {result.page > 1 ? (
            <Link href={hrefWith(filters, { page: result.page - 1 })} className={buttonClass("outline", "md")}>
              <ChevronIcon className="size-4 rotate-180" />
              Previous
            </Link>
          ) : <span />}
          <span className="text-sm text-muted">
            Page {result.page} of {result.pageCount}
          </span>
          {result.page < result.pageCount ? (
            <Link href={hrefWith(filters, { page: result.page + 1 })} className={buttonClass("outline", "md")}>
              Next
              <ChevronIcon className="size-4" />
            </Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-6 grid gap-3" aria-busy="true" aria-label="Loading leads">
      {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20" />)}
    </div>
  );
}
