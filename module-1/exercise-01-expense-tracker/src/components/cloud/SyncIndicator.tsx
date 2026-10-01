"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCloud } from "@/hooks/useCloud";
import { relativeTime } from "@/lib/cloud/schedule";
import { Spinner } from "./Primitives";

/** Compact cloud status shown in the top nav. */
export function SyncIndicator() {
  const { ready, online, syncing, connections, jobs } = useCloud();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!ready) return null;

  const synced = Object.values(connections).filter((c) => c?.autoSync);
  const last = synced
    .map((c) => c!.lastSyncAt)
    .filter(Boolean)
    .sort()
    .pop();
  const running = jobs.some((j) => j.status === "running");

  let dot = "bg-slate-300";
  let label = "Local only";
  let icon: React.ReactNode = null;
  if (!online) {
    dot = "bg-amber-500";
    label = "Offline: changes saved locally";
  } else if (syncing || running) {
    label = running ? "Exporting…" : "Syncing…";
    icon = <Spinner className="h-3 w-3 text-brand-600" />;
  } else if (synced.length) {
    dot = "bg-emerald-500";
    label = last ? `Synced ${relativeTime(new Date(last))}` : "Synced";
  }

  return (
    <Link
      href="/share?tab=integrations"
      title={synced.length ? `Auto-sync to ${synced.length} destination(s)` : "Set up cloud backup"}
      className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 md:inline-flex"
      data-testid="sync-indicator"
    >
      {icon ?? <span className={`h-2 w-2 rounded-full ${dot} ${dot === "bg-emerald-500" ? "shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" : ""}`} />}
      <span aria-hidden>☁</span>
      {label}
    </Link>
  );
}
