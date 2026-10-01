import { CATEGORY_STYLES } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import type { summarize } from "@/lib/analytics";

type Summary = ReturnType<typeof summarize>;

export function SummaryCards({ s }: { s: Summary }) {
  const change = s.monthChangePct;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Total spending" value={formatCurrency(s.total)} sub={`${s.count} expense${s.count === 1 ? "" : "s"}`} />
      <Card
        label="This month"
        value={formatCurrency(s.monthTotal)}
        sub={
          change === null ? (
            "No data for last month"
          ) : (
            <span className={change > 0 ? "text-red-600" : "text-emerald-600"}>
              {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(0)}% vs last month
            </span>
          )
        }
      />
      <Card label="Average expense" value={formatCurrency(s.average)} sub="per transaction" />
      <Card
        label="Top category"
        value={s.topCategory ? `${CATEGORY_STYLES[s.topCategory.category].icon} ${s.topCategory.category}` : "—"}
        sub={s.topCategory ? `${formatCurrency(s.topCategory.total)} total` : "No expenses yet"}
      />
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}
