"use client";

import { useMemo, useState } from "react";
import { useCloud, type HistoryEntry } from "@/hooks/useCloud";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { TEMPLATES, type TemplateId } from "@/lib/cloud/templates";
import { DESTINATIONS, getDestination, type DestinationId } from "@/lib/cloud/integrations";
import { relativeTime } from "@/lib/cloud/schedule";
import { BrandLogo, formatBytes, Spinner } from "./Primitives";
import { ConnectDialog } from "./ConnectDialog";
import { EmailDialog } from "./EmailDialog";
import { ShareDialog } from "./ShareDialog";
import { SheetsWindow } from "./SheetsWindow";

export function ExportPanel({ onGoTo }: { onGoTo: (tab: "automations" | "integrations") => void }) {
  const { expenses } = useExpenses();
  const { connections, history, schedules, runExport, buildArtifact } = useCloud();
  const toast = useToast();
  const [templateId, setTemplateId] = useState<TemplateId>("monthly-summary");
  const [destId, setDestId] = useState<DestinationId>("google-sheets");
  const [dialog, setDialog] = useState<null | "email" | "share" | { connect: DestinationId }>(null);
  const [sheet, setSheet] = useState<HistoryEntry | null>(null);
  const [running, setRunning] = useState(false);

  // Rebuild previews whenever the template or the underlying expenses change.
  const artifact = useMemo(() => buildArtifact(templateId), [buildArtifact, templateId, expenses]); // eslint-disable-line react-hooks/exhaustive-deps
  const dest = getDestination(destId);
  const needsConnect = dest.requiresAuth && !connections[destId];
  const webhookMissing = destId === "webhook" && !connections.webhook;

  const lastBackup = history.find((h) => h.status === "completed" && h.templateId === "full-backup");
  const daysSinceBackup = lastBackup ? (Date.now() - new Date(lastBackup.at).getTime()) / 86_400_000 : Infinity;
  const hasBackupSchedule = schedules.some((s) => s.enabled && s.templateId === "full-backup");

  const go = async () => {
    if (needsConnect || webhookMissing) return setDialog({ connect: destId });
    if (destId === "email") return setDialog("email");
    setRunning(true);
    const entry = await runExport(templateId, destId);
    setRunning(false);
    if (entry.status === "failed") return toast(entry.error ?? "Export failed.", "error");
    if (destId === "google-sheets") setSheet(entry);
    else toast(`Sent to ${dest.name}: ${entry.location}`);
  };

  const actionLabel =
    needsConnect || webhookMissing ? `Connect ${dest.name}` : destId === "download" ? "Download" : destId === "email" ? "Compose email" : `Send to ${dest.name}`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        {/* Templates */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">1 · Choose a template</h2>
          <div role="radiogroup" aria-label="Template" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TEMPLATES.map((t) => {
              const active = t.id === templateId;
              return (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTemplateId(t.id)}
                  className={`group relative overflow-hidden rounded-xl border bg-white p-4 text-left transition ${active ? "border-transparent ring-2 ring-brand-500" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-lg shadow-sm ${t.accent}`}>{t.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.tagline}</p>
                      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-brand-600">{t.audience}</p>
                    </div>
                  </div>
                  {active && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] text-white">✓</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Destinations */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">2 · Send it somewhere</h2>
          <div role="radiogroup" aria-label="Destination" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DESTINATIONS.map((d) => {
              const active = d.id === destId;
              const connected = !!connections[d.id];
              return (
                <button
                  key={d.id}
                  role="radio"
                  aria-checked={active}
                  aria-label={d.name}
                  onClick={() => setDestId(d.id)}
                  className={`flex items-center gap-2.5 rounded-xl border bg-white p-3 text-left transition ${active ? "border-transparent ring-2 ring-brand-500" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <BrandLogo id={d.id} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{d.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {d.requiresAuth || d.id === "webhook" ? (connected ? <span className="text-emerald-600">● Connected</span> : "Not connected") : d.id === "download" ? "This device" : "No setup needed"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Action bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <BrandLogo id={destId} size="lg" />
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold text-slate-900">{artifact.title}</p>
              <p className="truncate text-xs text-slate-500">
                {artifact.recordCount} records · {formatBytes(new Blob([artifact.content]).size)} → {dest.locationLabel(artifact.filename)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setDialog("share")} disabled={!expenses.length}>🔗 Share link</button>
            <button className="btn-primary min-w-36" onClick={go} disabled={running || !expenses.length} data-testid="run-export">
              {running ? <><Spinner /> Working…</> : actionLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar: preview + health */}
      <aside className="space-y-4">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Live preview</h3>
            <span className="text-xs text-slate-500">{artifact.table.rows.length} rows</span>
          </div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-xs" data-testid="template-preview">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                <tr>{artifact.table.columns.slice(0, 4).map((c) => <th key={c} className="px-3 py-1.5 font-medium">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {artifact.table.rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>{r.slice(0, 4).map((v, j) => <td key={j} className={`max-w-[8rem] truncate px-3 py-1.5 ${typeof v === "number" ? "text-right tabular-nums" : ""}`}>{typeof v === "number" ? (artifact.table.columns[j] === "Count" ? v : v.toFixed(2)) : v}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {!artifact.table.rows.length && <p className="px-4 py-6 text-center text-xs text-slate-500">No data yet for this template.</p>}
          </div>
        </section>

        <section className={`rounded-xl border p-4 ${daysSinceBackup > 7 && !hasBackupSchedule ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`} data-testid="backup-health">
          <p className="text-sm font-semibold text-slate-900">{daysSinceBackup > 7 && !hasBackupSchedule ? "⚠ Your data isn't backed up" : "✓ Backups look healthy"}</p>
          <p className="mt-1 text-xs text-slate-600">
            {lastBackup ? `Last full backup ${relativeTime(new Date(lastBackup.at))}.` : "No full backup yet."}{" "}
            {hasBackupSchedule ? "A recurring backup is scheduled." : "Everything lives in this browser only, so clearing site data would erase it."}
          </p>
          {!hasBackupSchedule && (
            <button className="mt-3 text-xs font-semibold text-brand-700 hover:underline" onClick={() => onGoTo("automations")}>
              Schedule automatic backups →
            </button>
          )}
        </section>
      </aside>

      {dialog === "email" && <EmailDialog templateId={templateId} onClose={() => setDialog(null)} />}
      {dialog === "share" && <ShareDialog templateId={templateId} onClose={() => setDialog(null)} />}
      {dialog && typeof dialog === "object" && <ConnectDialog id={dialog.connect} onClose={() => setDialog(null)} />}
      {sheet && <SheetsWindow entry={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}
