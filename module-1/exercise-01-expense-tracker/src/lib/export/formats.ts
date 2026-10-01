import type { Expense } from "../types";
import { formatCurrency, formatDate } from "../format";
import { totalsByCategory } from "../analytics";
import type { ExportContext, ExportFormat, ExportFormatId } from "./types";

// ---------- CSV ----------

function csvCell(value: string): string {
  // Neutralise spreadsheet formula injection, then quote if needed.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildCSV(expenses: Expense[]): string {
  const rows = [
    ["Date", "Category", "Amount", "Description"],
    ...expenses.map((e) => [e.date, e.category, e.amount.toFixed(2), csvCell(e.description)]),
  ];
  // BOM so Excel opens UTF-8 (emoji, accents) correctly.
  return "﻿" + rows.map((r) => r.join(",")).join("\r\n");
}

// ---------- JSON ----------

export function buildJSON(expenses: Expense[], ctx: ExportContext): string {
  const { options } = ctx;
  return JSON.stringify(
    {
      meta: {
        generatedAt: ctx.generatedAt.toISOString(),
        recordCount: expenses.length,
        total: ctx.total,
        currency: "USD",
        filters: {
          from: options.from || null,
          to: options.to || null,
          categories: options.categories,
        },
      },
      expenses: expenses.map(({ id, date, category, amount, description }) => ({
        id,
        date,
        category,
        amount,
        description,
      })),
    },
    null,
    2,
  );
}

// ---------- PDF ----------

async function buildPDF(expenses: Expense[], ctx: ExportContext): Promise<Blob> {
  // Lazy-load: ~300 KB of PDF code is only fetched when someone exports a PDF.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const brand: [number, number, number] = [79, 70, 229];
  const width = doc.internal.pageSize.getWidth();
  const { from, to } = ctx.options;

  doc.setFillColor(...brand).rect(0, 0, width, 64, "F");
  doc.setTextColor(255).setFontSize(18).setFont("helvetica", "bold").text("Expense Report", 40, 40);
  doc
    .setFontSize(9)
    .setFont("helvetica", "normal")
    .text(`Generated ${ctx.generatedAt.toLocaleString("en-US")}`, width - 40, 40, { align: "right" });

  doc.setTextColor(60).setFontSize(10);
  const period = from || to ? `${from ? formatDate(from) : "Beginning"} – ${to ? formatDate(to) : "Today"}` : "All time";
  doc.text(`Period: ${period}`, 40, 90);
  doc.text(`Categories: ${ctx.options.categories.join(", ")}`, 40, 105, { maxWidth: width - 80 });
  doc
    .setFont("helvetica", "bold")
    .text(`${expenses.length} records · Total ${formatCurrency(ctx.total)}`, 40, 125);

  const startY = 140;
  autoTable(doc, {
    startY,
    head: [["Category", "Total", "Share"]],
    body: totalsByCategory(expenses).map((c) => [
      c.category,
      formatCurrency(c.total),
      ctx.total ? `${((c.total / ctx.total) * 100).toFixed(1)}%` : "—",
    ]),
    theme: "grid",
    headStyles: { fillColor: [241, 245, 249], textColor: 30 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    margin: { left: 40, right: width / 2 },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY) + 20,
    head: [["Date", "Category", "Description", "Amount"]],
    body: expenses.map((e) => [formatDate(e.date), e.category, e.description, formatCurrency(e.amount)]),
    foot: [["", "", "Total", formatCurrency(ctx.total)]],
    headStyles: { fillColor: brand },
    footStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 3: { halign: "right" } },
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9 },
    didDrawPage: () => {
      const page = doc.getNumberOfPages();
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(8).setTextColor(150).text(`Page ${page}`, width - 40, h - 20, { align: "right" });
    },
  });

  return doc.output("blob");
}

// ---------- Registry ----------

export const EXPORT_FORMATS: Record<ExportFormatId, ExportFormat> = {
  csv: {
    id: "csv",
    label: "CSV",
    description: "Spreadsheets: Excel, Numbers, Google Sheets",
    extension: "csv",
    mimeType: "text/csv;charset=utf-8",
    build: async (e) => new Blob([buildCSV(e)], { type: "text/csv;charset=utf-8" }),
  },
  json: {
    id: "json",
    label: "JSON",
    description: "Structured data with metadata, for developers & backups",
    extension: "json",
    mimeType: "application/json",
    build: async (e, ctx) => new Blob([buildJSON(e, ctx)], { type: "application/json" }),
  },
  pdf: {
    id: "pdf",
    label: "PDF",
    description: "Formatted report with category summary, ready to print or share",
    extension: "pdf",
    mimeType: "application/pdf",
    build: buildPDF,
  },
};
