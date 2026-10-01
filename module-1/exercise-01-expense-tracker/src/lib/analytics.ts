import { CATEGORIES, type Category, type Expense, type ExpenseFilters } from "./types";

export function filterExpenses(expenses: Expense[], f: ExpenseFilters): Expense[] {
  const q = f.search.trim().toLowerCase();
  return expenses.filter(
    (e) =>
      (f.category === "All" || e.category === f.category) &&
      (!f.from || e.date >= f.from) &&
      (!f.to || e.date <= f.to) &&
      (!q || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)),
  );
}

/** Newest first; ties broken by creation time. */
export function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function sum(expenses: Expense[]): number {
  return Math.round(expenses.reduce((t, e) => t + e.amount, 0) * 100) / 100;
}

export function totalsByCategory(expenses: Expense[]): { category: Category; total: number }[] {
  const totals = new Map<Category, number>(CATEGORIES.map((c) => [c, 0]));
  for (const e of expenses) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  return [...totals]
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total);
}

/** Totals for the `count` months ending at `today`'s month, oldest first. Keys are YYYY-MM. */
export function monthlyTotals(
  expenses: Expense[],
  count: number,
  today: string,
): { month: string; total: number }[] {
  const [y, m] = today.split("-").map(Number);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const totals = new Map(months.map((k) => [k, 0]));
  for (const e of expenses) {
    const key = e.date.slice(0, 7);
    if (totals.has(key)) totals.set(key, totals.get(key)! + e.amount);
  }
  return months.map((month) => ({ month, total: Math.round(totals.get(month)! * 100) / 100 }));
}

export function summarize(expenses: Expense[], today: string) {
  const thisMonth = today.slice(0, 7);
  const [y, m] = today.split("-").map(Number);
  const prev = new Date(y, m - 2, 1);
  const lastMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const monthTotal = sum(expenses.filter((e) => e.date.startsWith(thisMonth)));
  const lastMonthTotal = sum(expenses.filter((e) => e.date.startsWith(lastMonth)));
  const byCategory = totalsByCategory(expenses);

  return {
    total: sum(expenses),
    count: expenses.length,
    monthTotal,
    lastMonthTotal,
    monthChangePct:
      lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null,
    average: expenses.length ? sum(expenses) / expenses.length : 0,
    topCategory: byCategory[0] ?? null,
    byCategory,
  };
}
