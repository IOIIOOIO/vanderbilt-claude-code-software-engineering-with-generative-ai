import { describe, expect, it } from "vitest";
import type { Expense } from "../types";
import { TEMPLATES, getTemplate, tableToCSV } from "./templates";
import { describeSchedule, isDue, nextRun, type Schedule } from "./schedule";
import { decodeShare, encodeShare, isExpired, type SharePayload } from "./share";

const exp = (p: Partial<Expense>): Expense => ({
  id: Math.random().toString(36).slice(2),
  date: "2026-10-01",
  amount: 10,
  category: "Food",
  description: "Lunch",
  createdAt: "2026-10-01T00:00:00Z",
  ...p,
});

const TODAY = "2026-10-15";
const data = [
  exp({ date: "2026-10-02", amount: 20, category: "Food" }),
  exp({ date: "2026-09-05", amount: 100, category: "Bills", description: "Power" }),
  exp({ date: "2026-03-01", amount: 5, category: "Food", description: "Coffee" }),
  exp({ date: "2025-12-31", amount: 999, category: "Shopping", description: "Last year" }),
];

describe("templates", () => {
  it("tax report covers this year only, with subtotals and a total", () => {
    const a = getTemplate("tax-report").build(data, TODAY);
    expect(a.recordCount).toBe(3);
    expect(a.filename).toBe("tax-report-2026-10-15.csv");
    const labels = a.table.rows.map((r) => r[1]);
    expect(labels).toContain("Food subtotal");
    expect(labels).not.toContain("Shopping subtotal");
    expect(a.table.rows.at(-1)).toEqual(["", "TOTAL", "3 items", 125]);
    // Food items come first (category order), oldest first within the category.
    expect(a.table.rows[0]).toEqual(["2026-03-01", "Food", "Coffee", 5]);
  });

  it("monthly summary has 12 rows with per-category columns", () => {
    const a = getTemplate("monthly-summary").build(data, TODAY);
    expect(a.table.rows).toHaveLength(12);
    expect(a.table.columns.at(-1)).toBe("Total");
    expect(a.table.rows.at(-1)).toEqual(["Oct 2026", 20, 0, 0, 0, 0, 0, 20]);
    expect(a.table.rows[1][0]).toBe("Dec 2025");
    expect(a.table.rows[1].at(-1)).toBe(999);
  });

  it("category analysis is sorted by total with shares", () => {
    const a = getTemplate("category-analysis").build(data, TODAY);
    expect(a.table.rows[0][0]).toBe("Shopping");
    const food = a.table.rows.find((r) => r[0] === "Food")!;
    expect(food).toEqual(["Food", 2, 25, 12.5, "2.2%", "Lunch (20.00)"]);
  });

  it("full backup is restorable JSON", () => {
    const a = getTemplate("full-backup").build(data, TODAY);
    const parsed = JSON.parse(a.content);
    expect(parsed.app).toBe("spendwise");
    expect(parsed.expenses).toHaveLength(4);
    expect(parsed.expenses[0]).toHaveProperty("id");
  });

  it("every template handles an empty dataset", () => {
    for (const t of TEMPLATES) expect(() => t.build([], TODAY)).not.toThrow();
  });

  it("CSV output guards against formula injection", () => {
    expect(tableToCSV(["A"], [["=CMD()"], ["a,b"]])).toBe('﻿A\r\n\'=CMD()\r\n"a,b"');
  });
});

describe("schedules", () => {
  const base = { weekday: 1, dayOfMonth: 15, time: "09:00" };
  const at = (s: string) => new Date(s); // local time

  it("daily: later today, else tomorrow", () => {
    expect(nextRun({ ...base, frequency: "daily" }, at("2026-10-15T08:00")).getTime()).toBe(at("2026-10-15T09:00").getTime());
    expect(nextRun({ ...base, frequency: "daily" }, at("2026-10-15T09:00")).getTime()).toBe(at("2026-10-16T09:00").getTime());
  });

  it("weekly: next matching weekday", () => {
    // 2026-10-15 is a Thursday; next Monday is the 19th.
    expect(nextRun({ ...base, frequency: "weekly" }, at("2026-10-15T12:00")).getTime()).toBe(at("2026-10-19T09:00").getTime());
    // On Monday after the time → the following Monday.
    expect(nextRun({ ...base, frequency: "weekly" }, at("2026-10-19T10:00")).getTime()).toBe(at("2026-10-26T09:00").getTime());
  });

  it("monthly: rolls over months and years", () => {
    expect(nextRun({ ...base, frequency: "monthly" }, at("2026-10-15T10:00")).getTime()).toBe(at("2026-11-15T09:00").getTime());
    expect(nextRun({ ...base, frequency: "monthly" }, at("2026-12-20T10:00")).getTime()).toBe(at("2027-01-15T09:00").getTime());
  });

  it("isDue detects missed runs and respects enabled", () => {
    const s: Schedule = {
      id: "1", name: "x", templateId: "full-backup", destinationId: "download", frequency: "daily",
      weekday: 0, dayOfMonth: 1, time: "09:00", enabled: true,
      createdAt: at("2026-10-14T10:00").toISOString(), lastRunAt: null,
    };
    expect(isDue(s, at("2026-10-15T08:59"))).toBe(false);
    expect(isDue(s, at("2026-10-15T09:00"))).toBe(true);
    expect(isDue({ ...s, enabled: false }, at("2026-10-20T09:00"))).toBe(false);
    expect(isDue({ ...s, lastRunAt: at("2026-10-15T09:00").toISOString() }, at("2026-10-15T20:00"))).toBe(false);
  });

  it("describes schedules in plain English", () => {
    expect(describeSchedule({ ...base, frequency: "weekly" })).toBe("Every Monday at 9:00 AM");
    expect(describeSchedule({ ...base, frequency: "monthly", dayOfMonth: 22 })).toBe("Monthly on the 22nd at 9:00 AM");
    expect(describeSchedule({ ...base, frequency: "monthly", dayOfMonth: 11 })).toBe("Monthly on the 11th at 9:00 AM");
  });
});

describe("share links", () => {
  const payload: SharePayload = {
    v: 1, title: "Tax Report 2026", createdAt: "2026-10-01T00:00:00Z", expiresAt: null,
    sharedBy: "Sam", note: "für dich 💸", columns: ["A", "B"], rows: [["x", 1.5], ["y", 2]],
  };

  it("round-trips through a URL-safe token, including unicode", async () => {
    const token = await encodeShare(payload);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeShare(token)).toEqual(payload);
  });

  it("compresses repetitive data", async () => {
    const big = { ...payload, rows: Array.from({ length: 200 }, (_, i) => ["Groceries", i]) };
    const token = await encodeShare(big);
    expect(token.length).toBeLessThan(JSON.stringify(big).length / 2);
  });

  it("rejects garbage and detects expiry", async () => {
    await expect(decodeShare("not-a-real-token")).rejects.toThrow();
    expect(isExpired({ ...payload, expiresAt: "2026-01-01T00:00:00Z" }, new Date("2026-02-01"))).toBe(true);
    expect(isExpired(payload)).toBe(false);
  });
});
