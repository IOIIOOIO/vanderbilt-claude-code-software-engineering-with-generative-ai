"use client";

import { useEffect, useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { CATEGORIES, CATEGORY_STYLES, type Category } from "@/lib/types";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import { EXPORT_FORMATS } from "@/lib/export/formats";
import { runExport, type ExportResult } from "@/lib/export/run";
import {
  RANGE_PRESETS,
  exportSummary,
  sanitizeFilename,
  selectForExport,
  validateOptions,
} from "@/lib/export/selection";
import type { ExportFormatId, ExportOptions } from "@/lib/export/types";
import { CategoryBadge } from "../ExpenseList";
import { Drawer } from "./Drawer";

const PREVIEW_ROWS = 8;

const FORMAT_ICONS: Record<ExportFormatId, string> = { csv: "📊", json: "🧩", pdf: "📄" };

type JobState =
  | { status: "idle" }
  | { status: "exporting"; step: string }
  | { status: "done"; result: ExportResult }
  | { status: "error"; message: string };

export function ExportCenter({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial: ExportOptions;
  onClose: () => void;
}) {
  const { expenses } = useExpenses();
  const toast = useToast();
  const [options, setOptions] = useState<ExportOptions>(initial);
  const [job, setJob] = useState<JobState>({ status: "idle" });

  // Reset each time the drawer opens, so it reflects the caller's starting point.
  useEffect(() => {
    if (open) {
      setOptions(initial);
      setJob({ status: "idle" });
    }
  }, [open, initial]);

  const selected = useMemo(() => selectForExport(expenses, options), [expenses, options]);
  const summary = useMemo(() => exportSummary(selected), [selected]);
  const errors = validateOptions(options);
  const hasErrors = Object.keys(errors).length > 0;
  const format = EXPORT_FORMATS[options.format];
  const busy = job.status === "exporting";
  const today = todayISO();
  const activePreset = RANGE_PRESETS.find((p) => {
    const r = p.range(today);
    return r.from === options.from && r.to === options.to;
  })?.id;

  const update = (patch: Partial<ExportOptions>) => {
    setOptions((o) => ({ ...o, ...patch }));
    if (job.status !== "exporting") setJob({ status: "idle" });
  };

  const toggleCategory = (c: Category) =>
    update({
      categories: options.categories.includes(c)
        ? options.categories.filter((x) => x !== c)
        : CATEGORIES.filter((x) => x === c || options.categories.includes(x)),
    });

  const handleExport = async () => {
    if (hasErrors || selected.length === 0) return;
    try {
      // Keep the spinner up long enough to register, even for tiny exports.
      const minDelay = new Promise((r) => setTimeout(r, 400));
      setJob({ status: "exporting", step: `Generating ${format.label}…` });
      const [result] = await Promise.all([runExport(expenses, options), minDelay]);
      setJob({ status: "done", result });
      toast(`Exported ${result.count} records to ${result.filename}`);
    } catch (err) {
      setJob({ status: "error", message: err instanceof Error ? err.message : "Export failed." });
    }
  };

  // Per-category counts within the current date range, for the chips.
  const countsInRange = useMemo(() => {
    const inRange = selectForExport(expenses, { ...options, categories: [...CATEGORIES] });
    const map = new Map<Category, number>();
    for (const e of inRange) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return map;
  }, [expenses, options]);

  const footer = (
    <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500" aria-live="polite">
        {job.status === "exporting" ? (
          job.step
        ) : job.status === "error" ? (
          <span className="text-red-600">{job.message}</span>
        ) : job.status === "done" ? (
          <span className="text-emerald-700">
            ✓ Saved <span className="font-mono">{job.result.filename}</span> ({formatBytes(job.result.bytes)})
          </span>
        ) : (
          <>
            <span className="font-semibold text-slate-900">{summary.count}</span> of {expenses.length} records ·{" "}
            <span className="font-semibold text-slate-900">{formatCurrency(summary.total)}</span>
          </>
        )}
      </p>
      <div className="flex gap-2">
        <button className="btn-secondary flex-1 sm:flex-none" onClick={onClose} disabled={busy}>
          {job.status === "done" ? "Close" : "Cancel"}
        </button>
        <button
          className="btn-primary min-w-44 flex-1 sm:flex-none"
          onClick={handleExport}
          disabled={busy || hasErrors || selected.length === 0}
        >
          {busy ? (
            <>
              <Spinner /> Exporting…
            </>
          ) : job.status === "done" ? (
            "Export again"
          ) : (
            `Export ${summary.count} as ${format.label}`
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Drawer open={open} onClose={busy ? () => {} : onClose} title="Export data" subtitle="Choose a format, narrow the data, and preview before downloading." footer={footer}>
      <fieldset disabled={busy} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* ---------- Options ---------- */}
        <div className="space-y-6 border-slate-200 p-6 lg:border-r">
          <Section step={1} title="Format">
            <div role="radiogroup" aria-label="Export format" className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {Object.values(EXPORT_FORMATS).map((f) => {
                const active = f.id === options.format;
                return (
                  <button
                    key={f.id}
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ format: f.id })}
                    className={`rounded-lg border p-3 text-left transition ${
                      active ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-slate-900">
                      <span aria-hidden>{FORMAT_ICONS[f.id]}</span> {f.label}
                    </div>
                    <p className="mt-1 text-xs leading-snug text-slate-500">{f.description}</p>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section step={2} title="Date range" error={errors.range}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {RANGE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => update(p.range(today))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    activePreset === p.id
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="export-from" className="label">Start date</label>
                <input id="export-from" type="date" className={`input ${errors.range ? "input-error" : ""}`} value={options.from} max={options.to || today} onChange={(e) => update({ from: e.target.value })} />
              </div>
              <div>
                <label htmlFor="export-to" className="label">End date</label>
                <input id="export-to" type="date" className={`input ${errors.range ? "input-error" : ""}`} value={options.to} min={options.from || undefined} max={today} onChange={(e) => update({ to: e.target.value })} />
              </div>
            </div>
          </Section>

          <Section
            step={3}
            title="Categories"
            error={errors.categories}
            action={
              <div className="flex gap-3 text-xs font-medium">
                <button className="text-brand-600 hover:text-brand-700" onClick={() => update({ categories: [...CATEGORIES] })}>All</button>
                <button className="text-brand-600 hover:text-brand-700" onClick={() => update({ categories: [] })}>None</button>
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CATEGORIES.map((c) => {
                const checked = options.categories.includes(c);
                return (
                  <label
                    key={c}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      checked ? "border-brand-200 bg-brand-50/50" : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <input type="checkbox" checked={checked} onChange={() => toggleCategory(c)} className="h-4 w-4 shrink-0 rounded accent-brand-600" />
                      <span aria-hidden>{CATEGORY_STYLES[c].icon}</span>
                      <span className="truncate">{c}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 text-xs tabular-nums text-slate-500">{countsInRange.get(c) ?? 0}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          <Section step={4} title="File name" error={errors.filename}>
            <div className={`flex overflow-hidden rounded-lg border shadow-sm focus-within:ring-2 ${errors.filename ? "border-red-400 focus-within:ring-red-500/20" : "border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-500/20"}`}>
              <input
                aria-label="File name"
                className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                value={options.filename}
                onChange={(e) => update({ filename: e.target.value })}
              />
              <span className="border-l border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-500">.{format.extension}</span>
            </div>
            {options.filename && sanitizeFilename(options.filename) !== options.filename.trim() && (
              <p className="mt-1 text-xs text-slate-500">
                Will be saved as <span className="font-mono">{sanitizeFilename(options.filename) || "expenses"}.{format.extension}</span>
              </p>
            )}
          </Section>
        </div>

        {/* ---------- Summary + Preview ---------- */}
        <div className="space-y-5 bg-slate-50/60 p-6">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Records" value={summary.count.toLocaleString()} />
            <Stat label="Total" value={formatCurrency(summary.total)} />
            <Stat
              label="Span"
              value={summary.earliest ? `${daysBetween(summary.earliest, summary.latest!)}d` : "—"}
              hint={summary.earliest ? `${formatDate(summary.earliest)} – ${formatDate(summary.latest!)}` : undefined}
            />
          </div>

          {summary.byCategory.length > 0 && (
            <div>
              <div className="flex h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden>
                {summary.byCategory.map((c) => (
                  <div key={c.category} style={{ width: `${(c.total / summary.total) * 100}%`, background: CATEGORY_STYLES[c.category].color }} title={`${c.category}: ${formatCurrency(c.total)}`} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                {summary.byCategory.map((c) => (
                  <span key={c.category} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_STYLES[c.category].color }} />
                    {c.category} {formatCurrency(c.total)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Preview</h3>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {selected.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-slate-500">No records match these options.</p>
              ) : (
                <table className="w-full text-sm" data-testid="export-preview">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                      <th className="hidden px-3 py-2 font-medium sm:table-cell">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selected.slice(0, PREVIEW_ROWS).map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{formatDate(e.date)}</td>
                        <td className="px-3 py-2"><CategoryBadge category={e.category} /></td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(e.amount)}</td>
                        <td className="hidden max-w-[12rem] truncate px-3 py-2 text-slate-700 sm:table-cell">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {selected.length > PREVIEW_ROWS && (
                <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
                  + {selected.length - PREVIEW_ROWS} more record{selected.length - PREVIEW_ROWS === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>
        </div>
      </fieldset>
    </Drawer>
  );
}

function Section({
  step,
  title,
  error,
  action,
  children,
}: {
  step: number;
  title: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-[11px] text-white">{step}</span>
          {title}
        </h3>
        {action}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3" title={hint}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-lg font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />;
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) + 1;
}

function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`;
}
