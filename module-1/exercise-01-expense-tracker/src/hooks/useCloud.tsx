"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useExpenses } from "./useExpenses";
import { useToast } from "./useToast";
import { todayISO } from "@/lib/format";
import { newId } from "@/lib/storage";
import { getTemplate, type ExportArtifact, type TemplateId } from "@/lib/cloud/templates";
import { getDestination, type DestinationId } from "@/lib/cloud/integrations";
import { isDue, type Schedule } from "@/lib/cloud/schedule";

const STORAGE_KEY = "expense-tracker:cloud:v1";
const STAGE_MS = 700;

export interface Connection {
  account: string;
  connectedAt: string;
  /** Storage providers can keep a continuously-updated backup. */
  autoSync: boolean;
  lastSyncAt: string | null;
  /** Webhook only. */
  url?: string;
}

export type Trigger = "manual" | "schedule" | "share";

export interface HistoryEntry {
  id: string;
  at: string;
  templateId: TemplateId;
  destinationId: DestinationId;
  trigger: Trigger;
  status: "completed" | "failed";
  recordCount: number;
  bytes: number;
  location: string;
  /** Simulated remote URL (Sheets/Drive/etc.). */
  remoteUrl?: string;
  recipients?: string[];
  error?: string;
}

export interface Job {
  id: string;
  templateId: TemplateId;
  destinationId: DestinationId;
  trigger: Trigger;
  stages: string[];
  stage: number;
  status: "running" | "completed" | "failed";
  startedAt: number;
  result?: HistoryEntry;
}

interface CloudState {
  connections: Partial<Record<DestinationId, Connection>>;
  history: HistoryEntry[];
  schedules: Schedule[];
}

const EMPTY: CloudState = { connections: {}, history: [], schedules: [] };

export interface RunOptions {
  trigger?: Trigger;
  recipients?: string[];
  message?: string;
}

interface CloudContextValue extends CloudState {
  ready: boolean;
  jobs: Job[];
  online: boolean;
  syncing: boolean;
  connect: (id: DestinationId, account: string, extra?: Partial<Connection>) => void;
  disconnect: (id: DestinationId) => void;
  setAutoSync: (id: DestinationId, on: boolean) => void;
  runExport: (templateId: TemplateId, destinationId: DestinationId, opts?: RunOptions) => Promise<HistoryEntry>;
  dismissJob: (id: string) => void;
  buildArtifact: (templateId: TemplateId) => ExportArtifact;
  saveSchedule: (s: Schedule) => void;
  deleteSchedule: (id: string) => void;
  clearHistory: () => void;
}

const CloudContext = createContext<CloudContextValue | null>(null);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function saveBlob(content: string, mimeType: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fakeRemoteUrl(dest: DestinationId, filename: string): string | undefined {
  const id = Math.random().toString(36).slice(2, 12);
  switch (dest) {
    case "google-sheets": return `https://docs.google.com/spreadsheets/d/${id}`;
    case "google-drive": return `https://drive.google.com/file/d/${id}`;
    case "dropbox": return `https://www.dropbox.com/home/Apps/Spendwise?preview=${encodeURIComponent(filename)}`;
    case "onedrive": return `https://onedrive.live.com/?id=${id}`;
    case "notion": return `https://www.notion.so/Spendwise-report-${id}`;
    default: return undefined;
  }
}

export function CloudProvider({ children }: { children: React.ReactNode }) {
  const { expenses, loading } = useExpenses();
  const toast = useToast();
  const [state, setState] = useState<CloudState>(EMPTY);
  const [ready, setReady] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Refs let long-running async jobs and timers see the latest data.
  const expensesRef = useRef(expenses);
  expensesRef.current = expenses;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* corrupt cloud settings: start fresh */
    }
    setReady(true);
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const update = useCallback((fn: (s: CloudState) => CloudState) => {
    setState((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage full: keep in memory */
      }
      return next;
    });
  }, []);

  const buildArtifact = useCallback(
    (templateId: TemplateId) => getTemplate(templateId).build(expensesRef.current, todayISO()),
    [],
  );

  const runExport = useCallback<CloudContextValue["runExport"]>(
    async (templateId, destinationId, opts = {}) => {
      const dest = getDestination(destinationId);
      const job: Job = {
        id: newId(),
        templateId,
        destinationId,
        trigger: opts.trigger ?? "manual",
        stages: dest.stages,
        stage: 0,
        status: "running",
        startedAt: Date.now(),
      };
      setJobs((j) => [job, ...j]);
      const patchJob = (p: Partial<Job>) => setJobs((all) => all.map((j) => (j.id === job.id ? { ...j, ...p } : j)));

      let entry: HistoryEntry;
      try {
        if (!navigator.onLine && destinationId !== "download") {
          throw new Error("You're offline. The export will need to be retried.");
        }
        if (dest.requiresAuth && !stateRef.current.connections[destinationId]) {
          throw new Error(`${dest.name} is not connected.`);
        }
        const artifact = getTemplate(templateId).build(expensesRef.current, todayISO());
        for (let i = 0; i < dest.stages.length; i++) {
          patchJob({ stage: i });
          await sleep(STAGE_MS + Math.random() * 300);
        }
        if (destinationId === "download") saveBlob(artifact.content, artifact.mimeType, artifact.filename);
        entry = {
          id: job.id,
          at: new Date().toISOString(),
          templateId,
          destinationId,
          trigger: job.trigger,
          status: "completed",
          recordCount: artifact.recordCount,
          bytes: new Blob([artifact.content]).size,
          location:
            destinationId === "email" && opts.recipients?.length
              ? `Email → ${opts.recipients.join(", ")}`
              : destinationId === "webhook"
                ? stateRef.current.connections.webhook?.url ?? "Webhook"
                : dest.locationLabel(artifact.filename),
          remoteUrl: fakeRemoteUrl(destinationId, artifact.filename),
          recipients: opts.recipients,
        };
        patchJob({ stage: dest.stages.length, status: "completed", result: entry });
      } catch (err) {
        entry = {
          id: job.id,
          at: new Date().toISOString(),
          templateId,
          destinationId,
          trigger: job.trigger,
          status: "failed",
          recordCount: 0,
          bytes: 0,
          location: dest.name,
          error: err instanceof Error ? err.message : "Unknown error",
        };
        patchJob({ status: "failed", result: entry });
      }
      update((s) => ({ ...s, history: [entry, ...s.history].slice(0, 100) }));
      // Completed jobs fade from the tray after a while.
      setTimeout(() => setJobs((all) => all.filter((j) => j.id !== job.id)), 8000);
      return entry;
    },
    [update],
  );

  // ---------- Scheduler: check on load and every 30s; catches up on runs missed while closed. ----------
  const firedAt = useRef(new Map<string, number>());
  useEffect(() => {
    if (!ready || loading) return;
    const tick = () => {
      const now = new Date();
      for (const s of stateRef.current.schedules) {
        if (!isDue(s, now)) continue;
        // Guard against double-firing before the lastRunAt update has re-rendered.
        if (now.getTime() - (firedAt.current.get(s.id) ?? 0) < 60_000) continue;
        firedAt.current.set(s.id, now.getTime());
        update((st) => ({
          ...st,
          schedules: st.schedules.map((x) => (x.id === s.id ? { ...x, lastRunAt: now.toISOString() } : x)),
        }));
        toast(`Running scheduled export “${s.name}”`, "info");
        runExport(s.templateId, s.destinationId, { trigger: "schedule" });
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [ready, loading, update, runExport, toast]);

  // ---------- Auto-sync: debounce expense changes into a silent backup to connected storage. ----------
  const firstSync = useRef(true);
  useEffect(() => {
    if (!ready || loading) return;
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    const targets = (Object.entries(stateRef.current.connections) as [DestinationId, Connection][])
      .filter(([, c]) => c.autoSync)
      .map(([id]) => id);
    if (!targets.length || !navigator.onLine) return;
    setSyncing(true);
    const t = setTimeout(() => {
      const at = new Date().toISOString();
      update((s) => ({
        ...s,
        connections: Object.fromEntries(
          Object.entries(s.connections).map(([id, c]) => [id, targets.includes(id as DestinationId) ? { ...c, lastSyncAt: at } : c]),
        ),
      }));
      setSyncing(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [expenses, ready, loading, update]);

  const value = useMemo<CloudContextValue>(
    () => ({
      ...state,
      ready,
      jobs,
      online,
      syncing,
      buildArtifact,
      runExport,
      connect: (id, account, extra) =>
        update((s) => ({
          ...s,
          connections: {
            ...s.connections,
            [id]: { account, connectedAt: new Date().toISOString(), autoSync: false, lastSyncAt: null, ...extra },
          },
        })),
      disconnect: (id) =>
        update((s) => {
          const connections = { ...s.connections };
          delete connections[id];
          return { ...s, connections };
        }),
      setAutoSync: (id, on) =>
        update((s) => {
          const c = s.connections[id];
          if (!c) return s;
          return { ...s, connections: { ...s.connections, [id]: { ...c, autoSync: on, lastSyncAt: on ? new Date().toISOString() : c.lastSyncAt } } };
        }),
      dismissJob: (id) => setJobs((j) => j.filter((x) => x.id !== id)),
      saveSchedule: (sch) =>
        update((s) => ({
          ...s,
          schedules: s.schedules.some((x) => x.id === sch.id)
            ? s.schedules.map((x) => (x.id === sch.id ? sch : x))
            : [...s.schedules, sch],
        })),
      deleteSchedule: (id) => update((s) => ({ ...s, schedules: s.schedules.filter((x) => x.id !== id) })),
      clearHistory: () => update((s) => ({ ...s, history: [] })),
    }),
    [state, ready, jobs, online, syncing, buildArtifact, runExport, update],
  );

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud(): CloudContextValue {
  const ctx = useContext(CloudContext);
  if (!ctx) throw new Error("useCloud must be used inside <CloudProvider>.");
  return ctx;
}
