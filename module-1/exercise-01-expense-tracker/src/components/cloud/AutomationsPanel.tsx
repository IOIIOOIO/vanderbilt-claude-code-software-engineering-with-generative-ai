"use client";

import { useEffect, useState } from "react";
import { useCloud } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { newId } from "@/lib/storage";
import { TEMPLATES, getTemplate } from "@/lib/cloud/templates";
import { DESTINATIONS, getDestination } from "@/lib/cloud/integrations";
import { describeSchedule, nextRun, relativeTime, type Frequency, type Schedule } from "@/lib/cloud/schedule";
import { BrandLogo, Pill, Toggle } from "./Primitives";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const blank = (): Schedule => ({
  id: newId(),
  name: "Weekly backup",
  templateId: "full-backup",
  destinationId: "download",
  frequency: "weekly",
  weekday: 0,
  dayOfMonth: 1,
  time: "09:00",
  enabled: true,
  createdAt: new Date().toISOString(),
  lastRunAt: null,
});

export function AutomationsPanel() {
  const { schedules, connections, saveSchedule, deleteSchedule, runExport } = useCloud();
  const toast = useToast();
  const [draft, setDraft] = useState<Schedule | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Only destinations that work unattended: built-ins plus anything connected.
  const usable = DESTINATIONS.filter((d) => !(d.requiresAuth || d.id === "webhook") || connections[d.id]);

  const save = () => {
    if (!draft || !draft.name.trim()) return;
    const isNew = !schedules.some((s) => s.id === draft.id);
    // New schedules start counting from now, so they don't fire immediately.
    saveSchedule({ ...draft, name: draft.name.trim(), createdAt: isNew ? new Date().toISOString() : draft.createdAt });
    toast(isNew ? "Automation created." : "Automation updated.");
    setDraft(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Scheduled exports</h2>
          <p className="text-sm text-slate-500">Recurring reports and backups that run on their own.</p>
        </div>
        {!draft && <button className="btn-primary" onClick={() => setDraft(blank())}>＋ New automation</button>}
      </div>

      {draft && (
        <div className="card space-y-4 border-brand-200 p-5 ring-2 ring-brand-500/10" data-testid="schedule-form">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sch-name" className="label">Name</label>
              <input id="sch-name" className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="sch-template" className="label">Template</label>
              <select id="sch-template" className="input" value={draft.templateId} onChange={(e) => setDraft({ ...draft, templateId: e.target.value as Schedule["templateId"] })}>
                {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sch-dest" className="label">Destination</label>
              <select id="sch-dest" className="input" value={draft.destinationId} onChange={(e) => setDraft({ ...draft, destinationId: e.target.value as Schedule["destinationId"] })}>
                {usable.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {usable.length < DESTINATIONS.length && <p className="mt-1 text-xs text-slate-500">Connect more services in Integrations to send there.</p>}
            </div>
            <div>
              <span className="label">Frequency</span>
              <div className="inline-flex w-full rounded-lg border border-slate-300 p-0.5" role="radiogroup" aria-label="Frequency">
                {(["daily", "weekly", "monthly"] as Frequency[]).map((f) => (
                  <button key={f} role="radio" aria-checked={draft.frequency === f} onClick={() => setDraft({ ...draft, frequency: f })}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${draft.frequency === f ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {draft.frequency === "weekly" && (
              <div>
                <span className="label">Day</span>
                <div className="flex gap-1">
                  {WEEKDAYS.map((w, i) => (
                    <button key={w} onClick={() => setDraft({ ...draft, weekday: i })} aria-pressed={draft.weekday === i}
                      className={`h-9 flex-1 rounded-md text-xs font-medium ${draft.weekday === i ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {draft.frequency === "monthly" && (
              <div>
                <label htmlFor="sch-dom" className="label">Day of month</label>
                <select id="sch-dom" className="input" value={draft.dayOfMonth} onChange={(e) => setDraft({ ...draft, dayOfMonth: Number(e.target.value) })}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="sch-time" className="label">Time</label>
              <input id="sch-time" type="time" className="input" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value || "09:00" })} />
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-600">
              <span className="font-medium text-slate-900">{describeSchedule(draft)}</span> · next run{" "}
              {nextRun(draft, new Date()).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => setDraft(null)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={!draft.name.trim()}>Save automation</button>
            </div>
          </div>
        </div>
      )}

      {schedules.length === 0 && !draft ? (
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-xl">⏰</div>
          <p className="font-semibold text-slate-900">No automations yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">Set up a weekly backup or a monthly report for your accountant, and Spendwise will handle it.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {schedules.map((s) => {
            const next = nextRun(s, new Date());
            const dest = getDestination(s.destinationId);
            const broken = (dest.requiresAuth || dest.id === "webhook") && !connections[dest.id];
            return (
              <li key={s.id} className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${s.enabled ? "" : "opacity-60"}`} data-testid="schedule-item">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-2xl" aria-hidden>{getTemplate(s.templateId).icon}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      {broken && <Pill tone="red">{dest.name} disconnected</Pill>}
                    </div>
                    <p className="text-sm text-slate-500">{getTemplate(s.templateId).name} → {dest.name} · {describeSchedule(s)}</p>
                    <p className="text-xs text-slate-400">
                      {s.enabled ? `Next run ${relativeTime(next)}` : "Paused"} · {s.lastRunAt ? `last ran ${relativeTime(new Date(s.lastRunAt))}` : "never run"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BrandLogo id={s.destinationId} size="sm" />
                  <button className="text-sm font-medium text-brand-600 hover:text-brand-700" onClick={() => { saveSchedule({ ...s, lastRunAt: new Date().toISOString() }); runExport(s.templateId, s.destinationId, { trigger: "schedule" }); }}>
                    Run now
                  </button>
                  <button className="text-sm font-medium text-slate-600 hover:text-slate-900" onClick={() => setDraft(s)}>Edit</button>
                  <button className="text-sm font-medium text-red-600 hover:text-red-700" onClick={() => { deleteSchedule(s.id); toast("Automation deleted.", "info"); }}>Delete</button>
                  <Toggle label={`Enable ${s.name}`} checked={s.enabled} onChange={(on) => saveSchedule({ ...s, enabled: on, lastRunAt: on ? new Date().toISOString() : s.lastRunAt })} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-slate-400">
        Demo note: without a server, automations run while Spendwise is open in a tab. Runs that were missed while it was closed catch up on your next visit. A production version would run them on a background job queue.
      </p>
    </div>
  );
}
