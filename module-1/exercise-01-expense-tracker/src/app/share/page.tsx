"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCloud } from "@/hooks/useCloud";
import { useExpenses } from "@/hooks/useExpenses";
import { ExportPanel } from "@/components/cloud/ExportPanel";
import { IntegrationsPanel } from "@/components/cloud/IntegrationsPanel";
import { AutomationsPanel } from "@/components/cloud/AutomationsPanel";
import { ActivityPanel } from "@/components/cloud/ActivityPanel";
import { EmptyState, Skeleton } from "@/components/States";

const TABS = [
  { id: "export", label: "Export & share", icon: "🚀" },
  { id: "integrations", label: "Integrations", icon: "🔌" },
  { id: "automations", label: "Automations", icon: "⏰" },
  { id: "activity", label: "Activity", icon: "📜" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function SharePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Hub />
    </Suspense>
  );
}

function Hub() {
  const params = useSearchParams();
  const { loading, expenses } = useExpenses();
  const { ready, connections, schedules, history, jobs } = useCloud();
  const [tab, setTab] = useState<TabId>(() => (TABS.find((t) => t.id === params.get("tab"))?.id ?? "export") as TabId);
  // Follow in-app links like /share?tab=integrations while already on this page.
  const paramTab = params.get("tab");
  useEffect(() => {
    const t = TABS.find((x) => x.id === paramTab)?.id;
    if (t) setTab(t);
  }, [paramTab]);
  // Purely client-side, so tabs keep working offline; the URL stays shareable.
  const go = (t: TabId) => {
    setTab(t);
    window.history.replaceState(null, "", `?tab=${t}`);
  };

  const badges: Partial<Record<TabId, number>> = {
    integrations: Object.keys(connections).length,
    automations: schedules.filter((s) => s.enabled).length,
    activity: jobs.filter((j) => j.status === "running").length || history.length,
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl" aria-hidden />
        <p className="text-sm font-medium text-white/80">Share & Sync</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Your data, everywhere it needs to be.</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Send reports to your accountant, sync backups to the cloud, schedule recurring exports and share read-only links, all from one place.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <div role="tablist" aria-label="Share & Sync sections" className="flex min-w-max gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => go(t.id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${tab === t.id ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <span aria-hidden>{t.icon}</span>
              {t.label}
              {!!badges[t.id] && <span className="rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{badges[t.id]}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading || !ready ? (
        <Skeleton className="h-96" />
      ) : tab === "export" && expenses.length === 0 ? (
        <div className="card"><EmptyState title="Nothing to export yet" message="Add some expenses (or load sample data from the dashboard) and come back." /></div>
      ) : (
        <div role="tabpanel">
          {tab === "export" && <ExportPanel onGoTo={go} />}
          {tab === "integrations" && <IntegrationsPanel />}
          {tab === "automations" && <AutomationsPanel />}
          {tab === "activity" && <ActivityPanel />}
        </div>
      )}
    </>
  );
}
