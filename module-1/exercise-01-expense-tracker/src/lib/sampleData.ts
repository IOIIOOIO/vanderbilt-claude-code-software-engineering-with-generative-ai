import type { Category, ExpenseInput } from "./types";

const TEMPLATES: [Category, string, number, number][] = [
  ["Food", "Groceries", 40, 120],
  ["Food", "Lunch with team", 12, 35],
  ["Food", "Coffee", 3, 7],
  ["Transportation", "Fuel", 35, 70],
  ["Transportation", "Ride share", 10, 30],
  ["Entertainment", "Movie tickets", 15, 40],
  ["Entertainment", "Streaming subscription", 10, 20],
  ["Shopping", "Clothing", 30, 150],
  ["Shopping", "Household supplies", 15, 60],
  ["Bills", "Electricity", 60, 140],
  ["Bills", "Phone plan", 40, 80],
  ["Other", "Gift", 20, 80],
];

/** Generates ~3 months of plausible expenses ending today, for demoing the app. */
export function generateSampleExpenses(today: Date = new Date()): ExpenseInput[] {
  const out: ExpenseInput[] = [];
  for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
    if (daysAgo > 0 && Math.random() < 0.45) continue;
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    const [category, description, min, max] =
      TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const amount = Math.round((min + Math.random() * (max - min)) * 100) / 100;
    out.push({ date, category, description, amount });
  }
  return out;
}
