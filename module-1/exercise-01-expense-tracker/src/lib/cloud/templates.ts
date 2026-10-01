import { CATEGORIES, type Expense } from "../types";
import { monthlyTotals, sortExpenses, sum } from "../analytics";
import { formatMonth } from "../format";

export type TemplateId = "tax-report" | "monthly-summary" | "category-analysis" | "full-backup";

/** A rendered export: tabular data plus the serialised file. */
export interface ExportArtifact {
  templateId: TemplateId;
  title: string;
  filename: string;
  mimeType: string;
  content: string;
  /** Tabular view used for previews, Google Sheets and shared links. */
  table: { columns: string[]; rows: (string | number)[][] };
  recordCount: number;
}

export interface ExportTemplate {
  id: TemplateId;
  name: string;
  tagline: string;
  icon: string;
  accent: string;
  audience: string;
  build: (expenses: Expense[], today: string) => ExportArtifact;
}

// ---------- helpers ----------

function cell(v: string | number): string {
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v; // formula-injection guard
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function tableToCSV(columns: string[], rows: (string | number)[][]): string {
  return "﻿" + [columns, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

const round = (n: number) => Math.round(n * 100) / 100;

function csvArtifact(
  templateId: TemplateId,
  title: string,
  slug: string,
  today: string,
  columns: string[],
  rows: (string | number)[][],
  recordCount: number,
): ExportArtifact {
  return {
    templateId,
    title,
    filename: `${slug}-${today}.csv`,
    mimeType: "text/csv",
    content: tableToCSV(columns, rows),
    table: { columns, rows },
    recordCount,
  };
}

// ---------- templates ----------

/** Year-to-date expenses grouped by category, with subtotals and a grand total. */
function taxReport(expenses: Expense[], today: string): ExportArtifact {
  const year = today.slice(0, 4);
  const ytd = expenses.filter((e) => e.date.startsWith(year));
  const rows: (string | number)[][] = [];
  for (const cat of CATEGORIES) {
    const items = sortExpenses(ytd.filter((e) => e.category === cat)).reverse();
    if (!items.length) continue;
    for (const e of items) rows.push([e.date, cat, e.description, round(e.amount)]);
    rows.push(["", `${cat} subtotal`, `${items.length} items`, sum(items)]);
  }
  rows.push(["", "TOTAL", `${ytd.length} items`, sum(ytd)]);
  return csvArtifact("tax-report", `Tax Report ${year}`, "tax-report", today, ["Date", "Category", "Description", "Amount"], rows, ytd.length);
}

/** Last 12 months × category pivot table. */
function monthlySummary(expenses: Expense[], today: string): ExportArtifact {
  const months = monthlyTotals(expenses, 12, today).map((m) => m.month);
  const rows = months.map((m) => {
    const inMonth = expenses.filter((e) => e.date.startsWith(m));
    return [formatMonth(m), ...CATEGORIES.map((c) => sum(inMonth.filter((e) => e.category === c))), sum(inMonth)];
  });
  const counted = expenses.filter((e) => months.includes(e.date.slice(0, 7))).length;
  return csvArtifact("monthly-summary", "Monthly Summary (12 months)", "monthly-summary", today, ["Month", ...CATEGORIES, "Total"], rows, counted);
}

/** Per-category statistics. */
function categoryAnalysis(expenses: Expense[], today: string): ExportArtifact {
  const grand = sum(expenses);
  const rows = CATEGORIES.map((c) => {
    const items = expenses.filter((e) => e.category === c);
    const total = sum(items);
    const largest = items.reduce<Expense | null>((m, e) => (!m || e.amount > m.amount ? e : m), null);
    return [
      c,
      items.length,
      total,
      items.length ? round(total / items.length) : 0,
      grand ? `${((total / grand) * 100).toFixed(1)}%` : "0.0%",
      largest ? `${largest.description} (${largest.amount.toFixed(2)})` : "—",
    ];
  }).sort((a, b) => (b[2] as number) - (a[2] as number));
  return csvArtifact("category-analysis", "Category Analysis", "category-analysis", today, ["Category", "Count", "Total", "Average", "Share", "Largest expense"], rows, expenses.length);
}

/** Lossless JSON backup that could be re-imported. */
function fullBackup(expenses: Expense[], today: string): ExportArtifact {
  const sorted = sortExpenses(expenses);
  return {
    templateId: "full-backup",
    title: "Full Backup",
    filename: `spendwise-backup-${today}.json`,
    mimeType: "application/json",
    content: JSON.stringify({ app: "spendwise", version: 1, exportedAt: new Date().toISOString(), expenses: sorted }, null, 2),
    table: {
      columns: ["Date", "Category", "Description", "Amount"],
      rows: sorted.map((e) => [e.date, e.category, e.description, e.amount]),
    },
    recordCount: expenses.length,
  };
}

export const TEMPLATES: ExportTemplate[] = [
  { id: "tax-report", name: "Tax Report", tagline: "Year-to-date, grouped by category with subtotals", icon: "🧾", accent: "from-emerald-500 to-teal-500", audience: "For your accountant", build: taxReport },
  { id: "monthly-summary", name: "Monthly Summary", tagline: "12-month pivot of spending by category", icon: "📅", accent: "from-sky-500 to-indigo-500", audience: "For budgeting", build: monthlySummary },
  { id: "category-analysis", name: "Category Analysis", tagline: "Totals, averages, share and biggest expense per category", icon: "📊", accent: "from-fuchsia-500 to-pink-500", audience: "For insights", build: categoryAnalysis },
  { id: "full-backup", name: "Full Backup", tagline: "Every record as JSON — restorable", icon: "🗄️", accent: "from-slate-600 to-slate-800", audience: "For safekeeping", build: fullBackup },
];

export const getTemplate = (id: TemplateId) => TEMPLATES.find((t) => t.id === id)!;
