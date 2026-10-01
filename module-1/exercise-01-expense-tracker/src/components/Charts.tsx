import { CATEGORY_STYLES, type Category } from "@/lib/types";
import { formatCurrency, formatMonth } from "@/lib/format";

/** Donut chart of spending by category, drawn with SVG stroke dashes. */
export function CategoryDonut({ data }: { data: { category: Category; total: number }[] }) {
  const total = data.reduce((t, d) => t + d.total, 0);
  const r = 60;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <svg viewBox="0 0 160 160" className="h-44 w-44 shrink-0 -rotate-90" role="img" aria-label="Spending by category">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f1f5f9" strokeWidth="22" />
        {data.map((d) => {
          const len = (d.total / total) * circumference;
          const el = (
            <circle
              key={d.category}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={CATEGORY_STYLES[d.category].color}
              strokeWidth="22"
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
            >
              <title>{`${d.category}: ${formatCurrency(d.total)}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.category} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="h-3 w-3 rounded-sm" style={{ background: CATEGORY_STYLES[d.category].color }} />
              {d.category}
            </span>
            <span className="tabular-nums text-slate-900">
              {formatCurrency(d.total)}
              <span className="ml-2 inline-block w-10 text-right text-xs text-slate-400">
                {((d.total / total) * 100).toFixed(0)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Vertical bar chart of monthly totals. */
export function MonthlyBars({ data }: { data: { month: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex h-56 items-end gap-2 sm:gap-4">
      {data.map((d, i) => {
        const current = i === data.length - 1;
        return (
          <div key={d.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[10px] tabular-nums text-slate-500 sm:text-xs">
              {d.total > 0 ? formatCurrency(Math.round(d.total)).replace(".00", "") : ""}
            </span>
            <div
              className={`w-full max-w-12 rounded-t-md transition-all ${current ? "bg-brand-600" : "bg-brand-100"}`}
              style={{ height: `${Math.max((d.total / max) * 100, d.total > 0 ? 2 : 0)}%` }}
              title={`${formatMonth(d.month)}: ${formatCurrency(d.total)}`}
            />
            <span className={`text-[10px] sm:text-xs ${current ? "font-semibold text-slate-900" : "text-slate-500"}`}>
              {formatMonth(d.month).split(" ")[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
