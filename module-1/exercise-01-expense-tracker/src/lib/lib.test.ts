import { describe, expect, it } from "vitest";
import { validateExpense } from "./validation";
import { filterExpenses, monthlyTotals, sortExpenses, summarize, totalsByCategory } from "./analytics";
import { toCSV } from "./csv";
import { parseExpenses } from "./storage";
import { formatCurrency } from "./format";
import { EMPTY_FILTERS, type Expense } from "./types";

const TODAY = "2026-10-15";

const exp = (p: Partial<Expense>): Expense => ({
  id: Math.random().toString(),
  date: "2026-10-01",
  amount: 10,
  category: "Food",
  description: "Lunch",
  createdAt: "2026-10-01T00:00:00Z",
  ...p,
});

const valid = { date: "2026-10-01", amount: "12.50", category: "Food", description: " Pizza " };

describe("validateExpense", () => {
  it("accepts valid input and normalises it", () => {
    expect(validateExpense(valid, TODAY).data).toEqual({
      date: "2026-10-01",
      amount: 12.5,
      category: "Food",
      description: "Pizza",
    });
  });

  it.each([
    [{ amount: "" }, "amount"],
    [{ amount: "-5" }, "amount"],
    [{ amount: "0" }, "amount"],
    [{ amount: "1.234" }, "amount"],
    [{ amount: "abc" }, "amount"],
    [{ date: "" }, "date"],
    [{ date: "2026-12-01" }, "date"],
    [{ category: "Travel" }, "category"],
    [{ description: "   " }, "description"],
    [{ description: "x".repeat(121) }, "description"],
  ])("rejects %o", (override, field) => {
    const r = validateExpense({ ...valid, ...override }, TODAY);
    expect(r.data).toBeUndefined();
    expect(r.errors).toHaveProperty(field);
  });
});

describe("analytics", () => {
  const list = [
    exp({ date: "2026-10-05", amount: 20, category: "Food", description: "Groceries" }),
    exp({ date: "2026-09-20", amount: 50, category: "Bills", description: "Power" }),
    exp({ date: "2026-10-10", amount: 5.5, category: "Transportation", description: "Bus" }),
  ];

  it("filters by category, date range and search", () => {
    expect(filterExpenses(list, { ...EMPTY_FILTERS, category: "Bills" })).toHaveLength(1);
    expect(filterExpenses(list, { ...EMPTY_FILTERS, from: "2026-10-01" })).toHaveLength(2);
    expect(filterExpenses(list, { ...EMPTY_FILTERS, to: "2026-10-05" })).toHaveLength(2);
    expect(filterExpenses(list, { ...EMPTY_FILTERS, search: "GROC" })).toHaveLength(1);
  });

  it("sorts newest first", () => {
    expect(sortExpenses(list).map((e) => e.date)).toEqual(["2026-10-10", "2026-10-05", "2026-09-20"]);
  });

  it("summarises totals and month-over-month change", () => {
    const s = summarize(list, TODAY);
    expect(s.total).toBe(75.5);
    expect(s.monthTotal).toBe(25.5);
    expect(s.lastMonthTotal).toBe(50);
    expect(s.monthChangePct).toBeCloseTo(-49);
    expect(s.topCategory?.category).toBe("Bills");
  });

  it("groups by category, omitting empty ones", () => {
    expect(totalsByCategory(list).map((t) => t.category)).toEqual(["Bills", "Food", "Transportation"]);
  });

  it("builds monthly buckets across a year boundary", () => {
    const m = monthlyTotals([exp({ date: "2025-12-03", amount: 7 })], 3, "2026-02-01");
    expect(m).toEqual([
      { month: "2025-12", total: 7 },
      { month: "2026-01", total: 0 },
      { month: "2026-02", total: 0 },
    ]);
  });
});

describe("toCSV", () => {
  it("escapes commas, quotes and formula prefixes", () => {
    const csv = toCSV([
      exp({ description: 'Dinner, "fancy"', amount: 3 }),
      exp({ description: "=SUM(A1)", amount: 4.5 }),
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Date,Category,Description,Amount");
    expect(lines[1]).toBe('2026-10-01,Food,"Dinner, ""fancy""",3.00');
    expect(lines[2]).toBe("2026-10-01,Food,'=SUM(A1),4.50");
  });
});

describe("parseExpenses", () => {
  it("returns [] for empty storage and drops malformed records", () => {
    expect(parseExpenses(null)).toEqual([]);
    const good = exp({});
    expect(parseExpenses(JSON.stringify([good, { id: 1 }, null]))).toEqual([good]);
  });

  it("throws on corrupt JSON", () => {
    expect(() => parseExpenses("{not json")).toThrow();
  });
});

it("formats currency", () => {
  expect(formatCurrency(1234.5)).toBe("$1,234.50");
});
