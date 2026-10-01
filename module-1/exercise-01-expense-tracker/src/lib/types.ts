export const CATEGORIES = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  /** ISO calendar date, YYYY-MM-DD (no time zone). */
  date: string;
  /** Amount in dollars, rounded to cents. */
  amount: number;
  category: Category;
  description: string;
  createdAt: string;
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt">;

export interface ExpenseFilters {
  search: string;
  category: Category | "All";
  from: string;
  to: string;
}

export const EMPTY_FILTERS: ExpenseFilters = {
  search: "",
  category: "All",
  from: "",
  to: "",
};

export const CATEGORY_STYLES: Record<Category, { color: string; badge: string; icon: string }> = {
  Food: { color: "#f59e0b", badge: "bg-amber-100 text-amber-800", icon: "🍔" },
  Transportation: { color: "#3b82f6", badge: "bg-blue-100 text-blue-800", icon: "🚗" },
  Entertainment: { color: "#a855f7", badge: "bg-purple-100 text-purple-800", icon: "🎬" },
  Shopping: { color: "#ec4899", badge: "bg-pink-100 text-pink-800", icon: "🛍️" },
  Bills: { color: "#ef4444", badge: "bg-red-100 text-red-800", icon: "🧾" },
  Other: { color: "#64748b", badge: "bg-slate-100 text-slate-800", icon: "📦" },
};
