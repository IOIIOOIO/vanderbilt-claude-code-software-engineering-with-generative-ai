"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { decodeShare, isExpired, type SharePayload } from "@/lib/cloud/share";
import { tableToCSV } from "@/lib/cloud/templates";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "expired"; payload: SharePayload }
  | { status: "ok"; payload: SharePayload };

/** Public, read-only viewer for share links. Decodes the report from the URL fragment. */
export default function SharedViewPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const load = async () => {
      const token = window.location.hash.slice(1);
      if (!token) return setState({ status: "error", message: "This link is missing its data." });
      try {
        const payload = await decodeShare(token);
        setState(isExpired(payload) ? { status: "expired", payload } : { status: "ok", payload });
      } catch {
        setState({ status: "error", message: "This link is damaged or incomplete. Ask the sender for a new one." });
      }
    };
    load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-sm text-white">$</span>
            Spendwise
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">👁 Read-only shared view</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8">
        {state.status === "loading" && <div className="h-64 animate-pulse rounded-xl bg-slate-200/70" />}

        {(state.status === "error" || state.status === "expired") && (
          <div className="card mx-auto max-w-md p-8 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-xl">{state.status === "expired" ? "⌛" : "⚠"}</div>
            <h1 className="font-semibold text-slate-900">{state.status === "expired" ? "This link has expired" : "Can't open this link"}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {state.status === "expired"
                ? `“${state.payload.title}” was available until ${new Date(state.payload.expiresAt!).toLocaleString()}.`
                : state.message}
            </p>
          </div>
        )}

        {state.status === "ok" && <Report p={state.payload} />}

        <p className="text-center text-xs text-slate-400">
          Shared with <Link href="/" className="font-medium text-brand-600 hover:underline">Spendwise</Link>. The report data is stored in the link itself, not on a server.
        </p>
      </main>
    </div>
  );
}

function Report({ p }: { p: SharePayload }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([tableToCSV(p.columns, p.rows)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.title.replace(/[^\w-]+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{p.title}</h1>
          <p className="text-sm text-slate-500">
            {p.sharedBy ? `Shared by ${p.sharedBy} · ` : ""}
            {new Date(p.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            {p.expiresAt && ` · expires ${new Date(p.expiresAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`}
          </p>
        </div>
        <button className="btn-secondary" onClick={download}>⇩ Download CSV</button>
      </div>
      {p.note && <div className="rounded-lg border-l-4 border-brand-500 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">“{p.note}”</div>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm" data-testid="shared-table">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>{p.columns.map((c) => <th key={c} className="whitespace-nowrap px-4 py-2.5 font-medium">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {p.rows.map((r, i) => {
              const strong = String(r[1] ?? "").includes("subtotal") || r[1] === "TOTAL";
              return (
                <tr key={i} className={strong ? "bg-slate-50 font-semibold" : ""}>
                  {r.map((v, j) => (
                    <td key={j} className={`whitespace-nowrap px-4 py-2 ${typeof v === "number" ? "text-right tabular-nums" : ""}`}>
                      {typeof v === "number" ? (Number.isInteger(v) && p.columns[j] === "Count" ? v : v.toLocaleString("en-US", { style: "currency", currency: "USD" })) : v}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
