import type { DayStat } from "@/lib/analytics/report";

const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function label(date: string, long = false) {
  const d = new Date(`${date}T00:00:00Z`);
  return (long ? weekdayFmt : dayFmt).format(d);
}

/**
 * Daily visitors as a single-series bar chart. Each bar is focusable and
 * shows its values on hover/focus; a table view carries the same numbers.
 * Pure server-rendered HTML/CSS, no chart library.
 */
export function VisitorChart({ days }: { days: DayStat[] }) {
  const max = Math.max(1, ...days.map((d) => d.visitors));
  const niceMax = max <= 5 ? 5 : Math.ceil(max / 5) * 5;
  const tickEvery = days.length > 31 ? 14 : days.length > 8 ? 5 : 1;

  return (
    <figure>
      <div className="flex gap-2">
        {/* y-axis */}
        <div className="flex h-48 flex-col justify-between pb-0 text-right text-[0.7rem] text-muted tabular-nums" aria-hidden="true">
          <span>{niceMax}</span>
          <span>{Math.round(niceMax / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48" aria-hidden="true">
            <div className="absolute inset-x-0 top-0 border-t border-line-soft" />
            <div className="absolute inset-x-0 top-1/2 border-t border-line-soft" />
            <div className="absolute inset-x-0 bottom-0 border-t border-line" />
          </div>
          <ol className="relative flex h-48 items-end gap-[2px]" aria-label="Daily visitors">
            {days.map((d, i) => {
              const third = i < days.length / 3 ? "left-0" : i >= (days.length * 2) / 3 ? "right-0" : "left-1/2 -translate-x-1/2";
              const h = (d.visitors / niceMax) * 100;
              return (
                <li key={d.date} className="group relative flex h-full flex-1 items-end justify-center outline-none" tabIndex={0}>
                  <span
                    className="block w-full max-w-6 rounded-t-[4px] bg-turf transition-colors group-hover:bg-turf-deep group-focus:bg-turf-deep"
                    style={{ height: `${Math.max(h, d.visitors ? 2 : 0)}%` }}
                  />
                  <span className={`pointer-events-none absolute bottom-full ${third} z-10 mb-2 hidden rounded-[3px] bg-char px-2.5 py-1.5 text-left text-xs whitespace-nowrap text-white shadow-lg group-hover:block group-focus:block`}>
                    <strong className="block text-sm tabular-nums">{d.visitors} visitors</strong>
                    <span className="block text-white/75 tabular-nums">{d.pageviews} page views · {d.leads} leads</span>
                    <span className="block text-white/60">{label(d.date, true)}</span>
                  </span>
                  <span className="sr-only">
                    {label(d.date, true)}: {d.visitors} visitors, {d.pageviews} page views, {d.leads} leads
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="mt-1.5 flex gap-[2px] text-[0.7rem] text-muted" aria-hidden="true">
            {days.map((d, i) => (
              <span key={d.date} className="flex-1 text-center whitespace-nowrap">
                {(days.length - 1 - i) % tickEvery === 0 ? label(d.date) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <details className="mt-4 text-sm">
        <summary className="inline-flex min-h-10 items-center font-semibold text-turf">Show as table</summary>
        <div className="mt-2 max-h-72 overflow-auto border border-line">
          <table className="w-full text-left tabular-nums">
            <thead className="sticky top-0 bg-paper text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Date</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Visitors</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Page views</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {[...days].reverse().map((d) => (
                <tr key={d.date}>
                  <th scope="row" className="px-3 py-1.5 font-normal">{label(d.date, true)}</th>
                  <td className="px-3 py-1.5 text-right">{d.visitors}</td>
                  <td className="px-3 py-1.5 text-right">{d.pageviews}</td>
                  <td className="px-3 py-1.5 text-right">{d.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
