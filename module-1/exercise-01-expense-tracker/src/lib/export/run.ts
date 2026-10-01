import type { Expense } from "../types";
import { sum } from "../analytics";
import { EXPORT_FORMATS } from "./formats";
import { sanitizeFilename, selectForExport } from "./selection";
import type { ExportOptions } from "./types";

export interface ExportResult {
  filename: string;
  count: number;
  bytes: number;
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Selects, builds and downloads. Separated from React so it can be reused or tested. */
export async function runExport(expenses: Expense[], options: ExportOptions): Promise<ExportResult> {
  const format = EXPORT_FORMATS[options.format];
  const selected = selectForExport(expenses, options);
  if (selected.length === 0) throw new Error("Nothing to export with the current filters.");
  const blob = await format.build(selected, {
    options,
    generatedAt: new Date(),
    total: sum(selected),
  });
  const filename = `${sanitizeFilename(options.filename) || "expenses"}.${format.extension}`;
  saveBlob(blob, filename);
  return { filename, count: selected.length, bytes: blob.size };
}
