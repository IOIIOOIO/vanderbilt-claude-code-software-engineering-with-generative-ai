"use client";

import { useState } from "react";
import { useCloud, saveBlob, type HistoryEntry } from "@/hooks/useCloud";
import { getTemplate } from "@/lib/cloud/templates";
import { getDestination } from "@/lib/cloud/integrations";
import { relativeTime } from "@/lib/cloud/schedule";
import { BrandLogo, Pill, formatBytes } from "./Primitives";
import { SheetsWindow } from "./SheetsWindow";

type Filter = "all" | "completed" | "failed" | "schedule";

export function ActivityPanel() {
  const { history, runExport, clearHistory, buildArtifact } = useCloud();
  const [filter, setFilter] = useState<Filter>("all");
  const [sheet, setSheet] = useState<HistoryEntry | null>(null);

  const shown = history.filter((h) =>
    filter === "all" ? true : filter === "schedule" ? h.trigger === "schedule" : h.status === filter,
  );
  const total = history.length;
  const ok = history.filter((h) => h.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Exports" value={total} />
        <Stat label="Success rate" value={total ? `${Math.round((ok / total) * 100)}%` : "—"} />
        <Stat label="Data sent" value={formatBytes(history.reduce((s, h) => s + h.bytes, 0))} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Filter history">
          {(["all", "completed", "failed", "schedule"] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {f === "schedule" ? "Automated" : f}
            </button>
          ))}
        </div>
        {total > 0 && <button className="text-xs font-medium text-slate-500 hover:text-red-600" onClick={clearHistory}>Clear history</button>}
      </div>

      {shown.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-slate-500">
          {total ? "Nothing matches this filter." : "Your exports will appear here, with where they went and how to get them back."}
        </div>
      ) : (
        <ol className="relative space-y-3 border-l-2 border-slate-200 pl-5" data-testid="history-list">
          {shown.map((h) => {
            const dest = getDestination(h.destinationId);
            return (
              <li key={h.id} className="relative">
                <span className={`absolute -left-[1.6rem] top-4 h-3 w-3 rounded-full ring-4 ring-slate-50 ${h.status === "completed" ? "bg-emerald-500" : "bg-red-500"}`} />
                <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <BrandLogo id={h.destinationId} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{getTemplate(h.templateId).name} → {dest.name}</p>
                      {h.status === "failed" ? <Pill tone="red">Failed</Pill> : <Pill tone="green">Completed</Pill>}
                      {h.trigger === "schedule" && <Pill tone="violet">⏰ Automated</Pill>}
                    </div>
                    <p className="truncate text-sm text-slate-500">{h.status === "failed" ? h.error : h.location}</p>
                    <p className="text-xs text-slate-400" title={new Date(h.at).toLocaleString()}>
                      {new Date(h.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {relativeTime(new Date(h.at))}
                      {h.status === "completed" && ` · ${h.recordCount} records · ${formatBytes(h.bytes)}`}
                    </p>
                  </div>
                  <div className="flex gap-3 text-sm font-medium">
                    {h.destinationId === "google-sheets" && h.status === "completed" && (
                      <button className="text-emerald-700 hover:underline" onClick={() => setSheet(h)}>Open sheet</button>
                    )}
                    {h.status === "completed" && (
                      <button
                        className="text-slate-600 hover:text-slate-900"
                        title="Regenerates the file from your current data"
                        onClick={() => {
                          const a = buildArtifact(h.templateId);
                          saveBlob(a.content, a.mimeType, a.filename);
                        }}
                      >
                        Download
                      </button>
                    )}
                    <button className="text-brand-600 hover:text-brand-700" onClick={() => runExport(h.templateId, h.destinationId, { recipients: h.recipients })}>
                      {h.status === "failed" ? "Retry" : "Re-run"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {sheet && <SheetsWindow entry={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
