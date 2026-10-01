import type { Category, Expense } from "../types";

export type ExportFormatId = "csv" | "json" | "pdf";

export interface ExportOptions {
  format: ExportFormatId;
  /** Inclusive YYYY-MM-DD bounds; empty string = unbounded. */
  from: string;
  to: string;
  categories: Category[];
  /** Base name chosen by the user, without extension. */
  filename: string;
}

/** Context passed to every format so outputs can include report metadata. */
export interface ExportContext {
  options: ExportOptions;
  generatedAt: Date;
  total: number;
}

export interface ExportFormat {
  id: ExportFormatId;
  label: string;
  description: string;
  extension: string;
  mimeType: string;
  /** May be async (e.g. lazy-loading a PDF library). */
  build: (expenses: Expense[], ctx: ExportContext) => Promise<Blob>;
}
