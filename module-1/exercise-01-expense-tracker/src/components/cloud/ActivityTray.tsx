"use client";

import { useCloud } from "@/hooks/useCloud";
import { getDestination } from "@/lib/cloud/integrations";
import { getTemplate } from "@/lib/cloud/templates";
import { BrandLogo, Spinner } from "./Primitives";

/** Floating panel showing background export jobs and their pipeline stage. */
export function ActivityTray() {
  const { jobs, dismissJob } = useCloud();
  if (!jobs.length) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:right-auto sm:w-80" aria-live="polite" data-testid="activity-tray">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Background tasks
          <span>{jobs.filter((j) => j.status === "running").length} running</span>
        </div>
        <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
          {jobs.map((j) => {
            const dest = getDestination(j.destinationId);
            const pct = j.status === "running" ? Math.round(((j.stage + 0.5) / j.stages.length) * 100) : 100;
            return (
              <li key={j.id} className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <BrandLogo id={j.destinationId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {getTemplate(j.templateId).name} → {dest.name}
                    </p>
                    <p className={`truncate text-xs ${j.status === "failed" ? "text-red-600" : "text-slate-500"}`}>
                      {j.status === "running" && j.stages[j.stage]}
                      {j.status === "completed" && `✓ ${j.result?.location}`}
                      {j.status === "failed" && j.result?.error}
                    </p>
                  </div>
                  {j.status === "running" ? (
                    <Spinner className="h-4 w-4 text-brand-600" />
                  ) : (
                    <button onClick={() => dismissJob(j.id)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600">✕</button>
                  )}
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${j.status === "failed" ? "bg-red-500" : j.status === "completed" ? "bg-emerald-500" : "bg-brand-600"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
