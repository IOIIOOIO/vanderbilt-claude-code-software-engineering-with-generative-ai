import { describe, expect, it } from "vitest";
import type { Expense } from "../types";
import { buildCSV, buildJSON, EXPORT_FORMATS } from "./formats";
import {
  RANGE_PRESETS,
  defaultOptions,
  exportSummary,
  sanitizeFilename,
  selectForExport,
  validateOptions,
} from "./selection";

const exp = (p: Partial<Expense>): Expense => ({
  id: p.id ?? Math.random().toString(36).slice(2),
  date: "2026-10-01",
  amount: 10,
  category: "Food",
  description: "Lunch",
  createdAt: "2026-10-01T00:00:00Z",
  ...p,
});

const data = [
  exp({ id: "a", date: "2026-08-15", amount: 100, category: "Bills" }),
  exp({ id: "b", date: "2026-09-10", amount: 20, category: "Food" }),
  exp({ id: "c", date: "2026-09-30", amount: 5, category: "Transportation" }),
  exp({ id: "d", date: "2026-10-01", amount: 7.5, category: "Food" }),
];

describe("selectForExport", () => {
  const base = defaultOptions("2026-10-01");

  it("includes everything by default, newest first", () => {
    expect(selectForExport(data, base).map((e) => e.id)).toEqual(["d", "c", "b", "a"]);
  });

  it("applies inclusive date bounds", () => {
    const r = selectForExport(data, { ...base, from: "2026-09-10", to: "2026-09-30" });
    expect(r.map((e) => e.id)).toEqual(["c", "b"]);
  });

  it("applies multi-category selection", () => {
    const r = selectForExport(data, { ...base, categories: ["Food", "Bills"] });
    expect(r.map((e) => e.id)).toEqual(["d", "b", "a"]);
  });
});

describe("exportSummary", () => {
  it("computes count, total and span", () => {
    expect(exportSummary(data)).toMatchObject({
      count: 4,
      total: 132.5,
      earliest: "2026-08-15",
      latest: "2026-10-01",
    });
    expect(exportSummary([])).toMatchObject({ count: 0, total: 0, earliest: null });
  });
});

describe("validateOptions", () => {
  it("flags inverted ranges, no categories and empty filenames", () => {
    const e = validateOptions({ format: "csv", from: "2026-10-02", to: "2026-10-01", categories: [], filename: "  " });
    expect(Object.keys(e).sort()).toEqual(["categories", "filename", "range"]);
    expect(validateOptions(defaultOptions())).toEqual({});
  });
});

describe("sanitizeFilename", () => {
  it.each([
    ["My Report", "My-Report"],
    ["../../etc/passwd", "etc-passwd"],
    ["q3:report?.csv", "q3-report"],
    ["  spaced   out  ", "spaced-out"],
    ["...", ""],
  ])("%s -> %s", (input, out) => expect(sanitizeFilename(input)).toBe(out));
});

describe("RANGE_PRESETS", () => {
  const r = (id: string, today: string) => RANGE_PRESETS.find((p) => p.id === id)!.range(today);
  it("computes last month across a year boundary", () => {
    expect(r("last-month", "2026-01-15")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });
  it("computes this month, YTD and 90 days", () => {
    expect(r("month", "2026-10-15")).toEqual({ from: "2026-10-01", to: "2026-10-15" });
    expect(r("ytd", "2026-10-15")).toEqual({ from: "2026-01-01", to: "2026-10-15" });
    expect(r("90d", "2026-03-31")).toEqual({ from: "2026-01-01", to: "2026-03-31" });
  });
});

describe("formats", () => {
  it("CSV has BOM, required columns, escaping and formula protection", () => {
    const csv = buildCSV([exp({ description: 'Dinner, "fancy"', amount: 3 }), exp({ description: "=HYPERLINK()" })]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("﻿Date,Category,Amount,Description");
    expect(lines[1]).toBe('2026-10-01,Food,3.00,"Dinner, ""fancy"""');
    expect(lines[2]).toBe("2026-10-01,Food,10.00,'=HYPERLINK()");
  });

  it("JSON includes metadata and filter context", () => {
    const opts = { ...defaultOptions(), from: "2026-09-01", categories: ["Food" as const] };
    const out = JSON.parse(buildJSON([data[1]], { options: opts, generatedAt: new Date("2026-10-01T12:00:00Z"), total: 20 }));
    expect(out.meta).toMatchObject({ recordCount: 1, total: 20, currency: "USD", filters: { from: "2026-09-01", to: null, categories: ["Food"] } });
    expect(out.expenses[0]).toEqual({ id: "b", date: "2026-09-10", category: "Food", amount: 20, description: "Lunch" });
    expect(out.expenses[0]).not.toHaveProperty("createdAt");
  });

  it("PDF builds a valid PDF blob", async () => {
    const blob = await EXPORT_FORMATS.pdf.build(data, { options: defaultOptions(), generatedAt: new Date(), total: 132.5 });
    const head = new TextDecoder().decode(await blob.slice(0, 5).arrayBuffer());
    expect(head).toBe("%PDF-");
    expect(blob.size).toBeGreaterThan(1000);
  });
});
