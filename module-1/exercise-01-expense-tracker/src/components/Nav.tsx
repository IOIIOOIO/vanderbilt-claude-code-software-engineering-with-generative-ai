"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SyncIndicator } from "./cloud/SyncIndicator";

const LINKS = [
  { href: "/", label: "Dashboard", short: "Home" },
  { href: "/expenses", label: "Expenses", short: "Expenses" },
  { href: "/share", label: "Share & Sync", short: "Sync" },
];

export function Nav({ onAdd }: { onAdd: () => void }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">$</span>
          <span className="hidden sm:inline">Spendwise</span>
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium transition sm:px-3 ${
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="hidden sm:inline">{l.label}</span>
                <span className="sm:hidden">{l.short}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
        <SyncIndicator />
        <button onClick={onAdd} className="btn-primary">
          <span aria-hidden>＋</span>
          <span className="hidden sm:inline">Add expense</span>
          <span className="sm:hidden">Add</span>
        </button>
        </div>
      </div>
    </header>
  );
}
