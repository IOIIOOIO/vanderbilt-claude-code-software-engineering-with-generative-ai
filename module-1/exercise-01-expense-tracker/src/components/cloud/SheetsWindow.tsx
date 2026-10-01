"use client";

import { useMemo } from "react";
import { useCloud, type HistoryEntry } from "@/hooks/useCloud";
import { BrandLogo } from "./Primitives";

const COLS = "ABCDEFGHIJKLMNOP";

/** Mock of the Google Sheets document the export "created", rendered from the real data. */
export function SheetsWindow({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const { buildArtifact } = useCloud();
  const artifact = useMemo(() => buildArtifact(entry.templateId), [buildArtifact, entry.templateId]);
  const { columns, rows } = artifact.table;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 sm:p-6" onClick={onClose}>
      <div role="dialog" aria-label="Google Sheets preview" className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
          <span className="flex gap-1.5"><i className="h-3 w-3 rounded-full bg-red-400" /><i className="h-3 w-3 rounded-full bg-amber-400" /><i className="h-3 w-3 rounded-full bg-emerald-400" /></span>
          <span className="flex-1 truncate rounded-md bg-white px-3 py-1 font-mono text-xs text-slate-500">{entry.remoteUrl}</span>
          <button onClick={onClose} aria-label="Close" className="rounded px-2 text-slate-500 hover:bg-slate-200">✕</button>
        </div>
        {/* sheets header */}
        <div className="flex items-center gap-3 px-4 py-2">
          <BrandLogo id="google-sheets" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{artifact.title}</p>
            <p className="text-xs text-slate-500">Spendwise folder · Saved to Drive · <span className="text-emerald-600">● Live-linked</span></p>
          </div>
          <span className="ml-auto hidden rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800 sm:inline">Share</span>
        </div>
        <div className="flex items-center gap-2 border-y border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs text-slate-500">
          <span className="w-8 text-center">fx</span>
          <span className="truncate">{columns[0]}</span>
        </div>
        {/* grid */}
        <div className="overflow-auto">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-10 w-10 border border-slate-200 bg-slate-100" />
                {columns.map((_, i) => <th key={i} className="sticky top-0 min-w-[7rem] border border-slate-200 bg-slate-100 px-2 py-1 font-normal text-slate-500">{COLS[i]}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="sticky left-0 border border-slate-200 bg-slate-100 px-2 text-center text-slate-500">1</td>
                {columns.map((c) => <td key={c} className="border border-slate-200 bg-emerald-50 px-2 py-1 font-semibold text-slate-900">{c}</td>)}
              </tr>
              {rows.slice(0, 60).map((r, i) => (
                <tr key={i}>
                  <td className="sticky left-0 border border-slate-200 bg-slate-100 px-2 text-center text-slate-500">{i + 2}</td>
                  {r.map((v, j) => (
                    <td key={j} className={`whitespace-nowrap border border-slate-200 px-2 py-1 ${typeof v === "number" ? "text-right tabular-nums" : ""} ${String(r[1]).includes("subtotal") || r[1] === "TOTAL" ? "font-semibold" : ""}`}>
                      {typeof v === "number" ? (columns[j] === "Count" ? v : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-1 border-t border-slate-200 bg-slate-50 px-2 py-1 text-xs">
          <span className="rounded-t bg-white px-3 py-1 font-medium text-emerald-700 shadow-sm">{artifact.title.split(" (")[0]}</span>
          <span className="ml-auto pr-2 text-slate-400">Simulated: showing the data that would be written</span>
        </div>
      </div>
    </div>
  );
}
