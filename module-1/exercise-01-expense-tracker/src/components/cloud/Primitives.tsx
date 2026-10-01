"use client";

import { getDestination, type DestinationId } from "@/lib/cloud/integrations";

export function BrandLogo({ id, size = "md" }: { id: DestinationId; size?: "sm" | "md" | "lg" }) {
  const d = getDestination(id);
  const dims = { sm: "h-6 w-6 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" }[size];
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-lg font-bold text-white shadow-sm ${dims}`}
      style={{ background: d.color }}
    >
      {d.mono}
    </span>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <span aria-hidden className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;
}

export function Pill({ tone, children }: { tone: "green" | "red" | "blue" | "slate" | "amber" | "violet"; children: React.ReactNode }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
    blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
    slate: "bg-slate-50 text-slate-600 ring-slate-500/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${checked ? "bg-brand-600" : "bg-slate-300"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`;
}
