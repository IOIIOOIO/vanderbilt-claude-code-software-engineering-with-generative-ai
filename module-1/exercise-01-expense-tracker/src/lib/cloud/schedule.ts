import type { TemplateId } from "./templates";
import type { DestinationId } from "./integrations";

export type Frequency = "daily" | "weekly" | "monthly";

export interface Schedule {
  id: string;
  name: string;
  templateId: TemplateId;
  destinationId: DestinationId;
  frequency: Frequency;
  /** 0 = Sunday … 6 = Saturday (weekly only). */
  weekday: number;
  /** 1–28 (monthly only; capped at 28 so every month has it). */
  dayOfMonth: number;
  /** "HH:MM", local time. */
  time: string;
  enabled: boolean;
  createdAt: string;
  lastRunAt: string | null;
}

/** The first run time strictly after `after`, in local time. */
export function nextRun(s: Pick<Schedule, "frequency" | "weekday" | "dayOfMonth" | "time">, after: Date): Date {
  const [h, m] = s.time.split(":").map(Number);
  const at = (y: number, mo: number, d: number) => new Date(y, mo, d, h, m, 0, 0);
  const y = after.getFullYear();
  const mo = after.getMonth();
  const d = after.getDate();

  if (s.frequency === "daily") {
    const today = at(y, mo, d);
    return today > after ? today : at(y, mo, d + 1);
  }
  if (s.frequency === "weekly") {
    const delta = (s.weekday - after.getDay() + 7) % 7;
    const candidate = at(y, mo, d + delta);
    return candidate > after ? candidate : at(y, mo, d + delta + 7);
  }
  const day = Math.min(Math.max(s.dayOfMonth, 1), 28);
  const candidate = at(y, mo, day);
  return candidate > after ? candidate : at(y, mo + 1, day);
}

/** Whether a schedule has a run that was due between its last run (or creation) and `now`. */
export function isDue(s: Schedule, now: Date): boolean {
  if (!s.enabled) return false;
  const since = new Date(s.lastRunAt ?? s.createdAt);
  return nextRun(s, since) <= now;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function describeSchedule(s: Pick<Schedule, "frequency" | "weekday" | "dayOfMonth" | "time">): string {
  const [h, m] = s.time.split(":").map(Number);
  const time = new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (s.frequency === "daily") return `Every day at ${time}`;
  if (s.frequency === "weekly") return `Every ${WEEKDAYS[s.weekday]} at ${time}`;
  const n = s.dayOfMonth;
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `Monthly on the ${n}${suffix} at ${time}`;
}

export function relativeTime(target: Date, now: Date = new Date()): string {
  const diff = target.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [86_400_000, "day"],
    [3_600_000, "hour"],
    [60_000, "minute"],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [ms, unit] of units) if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  return diff >= 0 ? "in a moment" : "just now";
}
