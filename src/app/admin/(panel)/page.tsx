import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { logFirebaseError } from "@/lib/firebase/errors";
import { getAnalyticsReport, PERIODS, dayRange, type PeriodId } from "@/lib/analytics/report";
import { PATH_LABELS } from "@/lib/analytics/paths";
import { leadCounts, recentLeads } from "@/lib/leads/repo";
import { serviceShort } from "@/lib/domain";
import { AdminTitle, Panel, SetupNotice, Skeleton, StatusBadge, formatDateTime } from "@/components/admin/ui";
import { VisitorChart } from "@/components/admin/visitor-chart";
import { DeviceSettings } from "./pwa";

export const metadata: Metadata = { title: "Dashboard" };

const nf = new Intl.NumberFormat("en-IN");

export default function DashboardPage({ searchParams }: PageProps<"/admin">) {
  return (
    <>
      <AdminTitle title="Dashboard">
        <Suspense fallback={null}>
          <PeriodPicker searchParams={searchParams} />
        </Suspense>
      </AdminTitle>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
      <div className="mt-8">
        <DeviceSettings />
      </div>
    </>
  );
}

async function resolvePeriod(searchParams: PageProps<"/admin">["searchParams"]) {
  const raw = (await searchParams).period;
  return PERIODS.find((p) => p.id === raw) ?? PERIODS[1];
}

async function PeriodPicker({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const period = await resolvePeriod(searchParams);
  return (
    <nav aria-label="Period" className="inline-flex rounded-[3px] border border-line bg-white p-0.5">
      {PERIODS.map((p) => (
        <Link
          key={p.id}
          href={`/admin?period=${p.id satisfies PeriodId}`}
          aria-current={p.id === period.id ? "true" : undefined}
          className={`inline-flex min-h-10 items-center rounded-[2px] px-3 text-sm font-semibold ${
            p.id === period.id ? "bg-navy text-white" : "text-muted hover:text-navy"
          }`}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border border-line bg-white p-4 sm:p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 font-display text-[2.4rem] leading-none font-bold text-navy tabular-nums">{value}</p>
      <p className="mt-2 text-xs leading-snug text-muted">{note}</p>
    </div>
  );
}

async function DashboardContent({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireAdmin();
  const period = await resolvePeriod(searchParams);

  let data;
  try {
    const [report, counts, recent] = await Promise.all([
      getAnalyticsReport(period.days),
      leadCounts(dayRange(period.days)[0]!),
      recentLeads(5),
    ]);
    data = { report, counts, recent };
  } catch (err) {
    const kind = logFirebaseError("admin dashboard", err);
    return (
      <div className="mt-6">
        <SetupNotice kind={kind} />
      </div>
    );
  }
  const { report, counts, recent } = data;
  const conversion = report.totals.visitors ? (report.totals.leads / report.totals.visitors) * 100 : null;
  const hasTraffic = report.totals.pageviews > 0;

  return (
    <div className="mt-6 grid gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={`Visitors, last ${period.label}`}
          value={nf.format(report.totals.visitors)}
          note="Distinct visitors per day, added up across the period"
        />
        <Stat
          label={`Page views, last ${period.label}`}
          value={nf.format(report.totals.pageviews)}
          note="Every page opened, including repeat views"
        />
        <Stat label="Total leads" value={nf.format(counts.total)} note={`${nf.format(counts.inPeriod)} in the last ${period.label}`} />
        <Stat label="New leads" value={nf.format(counts.new)} note="Status still New (not yet contacted)" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Daily visitors">
          {hasTraffic ? (
            <VisitorChart days={report.days} />
          ) : (
            <p className="py-10 text-center text-muted">
              No visits recorded in this period yet. Numbers appear here as people open the website.
            </p>
          )}
          <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Enquiry form submissions</dt>
              <dd className="font-semibold text-navy tabular-nums">{nf.format(report.totals.leads)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Enquiry rate (enquiries ÷ visitors)</dt>
              <dd className="font-semibold text-navy tabular-nums">{conversion === null ? "–" : `${conversion.toFixed(1)}%`}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">All-time page views</dt>
              <dd className="font-semibold text-navy tabular-nums">{nf.format(report.allTime.pageviews)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">All-time visitors (daily, added up)</dt>
              <dd className="font-semibold text-navy tabular-nums">{nf.format(report.allTime.visitorDays)}</dd>
            </div>
          </dl>
        </Panel>

        <div className="grid content-start gap-6">
          <Panel title="Most visited pages">
            {report.topPages.length ? (
              <table className="w-full text-sm">
                <caption className="sr-only">Page views by page, last {period.label}</caption>
                <tbody className="divide-y divide-line-soft">
                  {report.topPages.map((p) => (
                    <tr key={p.path}>
                      <th scope="row" className="py-2 text-left font-normal">{PATH_LABELS[p.path] ?? p.path}</th>
                      <td className="py-2 text-right font-semibold text-navy tabular-nums">{nf.format(p.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted">No page views yet.</p>
            )}
          </Panel>
          <Panel title="Where visitors came from">
            {report.topSources.length ? (
              <table className="w-full text-sm">
                <caption className="sr-only">Visits from other websites, last {period.label}</caption>
                <tbody className="divide-y divide-line-soft">
                  {report.topSources.map((s) => (
                    <tr key={s.host}>
                      <th scope="row" className="py-2 text-left font-normal break-all">{s.host}</th>
                      <td className="py-2 text-right font-semibold text-navy tabular-nums">{nf.format(s.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted">No visits from other websites yet. Direct visits aren&rsquo;t listed.</p>
            )}
          </Panel>
        </div>
      </div>

      <Panel
        title="Recent enquiries"
        action={
          <Link href="/admin/leads" className="text-sm font-semibold text-turf hover:text-turf-deep">
            All leads
          </Link>
        }
      >
        {recent.length ? (
          <ul className="-my-2 divide-y divide-line-soft">
            {recent.map((l) => (
              <li key={l.id}>
                <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-paper sm:flex-nowrap">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-navy">{l.fullName}</span>
                    <span className="block truncate text-sm text-muted">
                      {serviceShort(l.requestedService)}, {l.projectCity}
                    </span>
                  </span>
                  <span className="text-sm text-muted">{formatDateTime(l.createdAt)}</span>
                  <StatusBadge status={l.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No enquiries yet. They&rsquo;ll appear here as soon as someone sends the quote form.</p>
        )}
      </Panel>

      <p className="text-xs leading-relaxed text-muted">
        How these numbers work: a visitor is one browser on one network on one IST calendar day, identified by an
        anonymous code that changes daily, so someone who visits on three days counts three times. Visits from bots,
        the admin app and browsers with Global Privacy Control turned on aren&rsquo;t counted.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 grid gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <Skeleton className="h-80" />
      <Skeleton className="h-56" />
    </div>
  );
}
