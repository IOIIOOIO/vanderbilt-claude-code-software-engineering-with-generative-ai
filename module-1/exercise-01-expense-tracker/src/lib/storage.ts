import { CATEGORIES, type Expense } from "./types";

export const STORAGE_KEY = "expense-tracker:expenses:v1";

function isExpense(x: unknown): x is Expense {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.date === "string" &&
    typeof e.amount === "number" &&
    typeof e.description === "string" &&
    typeof e.createdAt === "string" &&
    (CATEGORIES as readonly string[]).includes(e.category as string)
  );
}

/** Parses stored JSON, dropping malformed records rather than failing outright. */
export function parseExpenses(raw: string | null): Expense[] {
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Stored data is not a list.");
  return data.filter(isExpense);
}

export function loadExpenses(): Expense[] {
  return parseExpenses(window.localStorage.getItem(STORAGE_KEY));
}

export function saveExpenses(expenses: Expense[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
