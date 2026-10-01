import { CATEGORIES, type Category, type Expense } from "../types";
import { sortExpenses, sum, totalsByCategory } from "../analytics";
import { todayISO } from "../format";
import type { ExportOptions } from "./types";

export function selectForExport(expenses: Expense[], o: ExportOptions): Expense[] {
  const cats = new Set<Category>(o.categories);
  return sortExpenses(
    expenses.filter(
      (e) => cats.has(e.category) && (!o.from || e.date >= o.from) && (!o.to || e.date <= o.to),
    ),
  );
}

export function exportSummary(selected: Expense[]) {
  const dates = selected.map((e) => e.date).sort();
  return {
    count: selected.length,
    total: sum(selected),
    earliest: dates[0] ?? null,
    latest: dates[dates.length - 1] ?? null,
    byCategory: totalsByCategory(selected),
  };
}

export type OptionsError = Partial<Record<"range" | "categories" | "filename", string>>;

export function validateOptions(o: ExportOptions): OptionsError {
  const errors: OptionsError = {};
  if (o.from && o.to && o.from > o.to) errors.range = "Start date must be on or before end date.";
  if (o.categories.length === 0) errors.categories = "Select at least one category.";
  if (!sanitizeFilename(o.filename)) errors.filename = "Enter a file name.";
  return errors;
}

/** Strips path separators, reserved characters and any extension the user typed. */
export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/\.(csv|json|pdf)$/i, "")
    .replace(/[\\/:*?"<>|\x00-\x1f]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
}

export function defaultOptions(today: string = todayISO()): ExportOptions {
  return {
    format: "csv",
    from: "",
    to: "",
    categories: [...CATEGORIES],
    filename: `expenses-${today}`,
  };
}

export interface RangePreset {
  id: string;
  label: string;
  range: (today: string) => { from: string; to: string };
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parts = (t: string) => t.split("-").map(Number) as [number, number, number];

export const RANGE_PRESETS: RangePreset[] = [
  { id: "all", label: "All time", range: () => ({ from: "", to: "" }) },
  {
    id: "month",
    label: "This month",
    range: (t) => ({ from: `${t.slice(0, 7)}-01`, to: t }),
  },
  {
    id: "last-month",
    label: "Last month",
    range: (t) => {
      const [y, m] = parts(t);
      return { from: iso(new Date(y, m - 2, 1)), to: iso(new Date(y, m - 1, 0)) };
    },
  },
  {
    id: "90d",
    label: "Last 90 days",
    range: (t) => {
      const [y, m, d] = parts(t);
      return { from: iso(new Date(y, m - 1, d - 89)), to: t };
    },
  },
  { id: "ytd", label: "Year to date", range: (t) => ({ from: `${t.slice(0, 4)}-01-01`, to: t }) },
];
