"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { useEditor } from "@/components/AppShell";
import { SummaryCards } from "@/components/SummaryCards";
import { CategoryDonut, MonthlyBars } from "@/components/Charts";
import { ExpenseList } from "@/components/ExpenseList";
import { EmptyState, Skeleton } from "@/components/States";
import { monthlyTotals, sortExpenses, summarize } from "@/lib/analytics";
import { todayISO } from "@/lib/format";
import { generateSampleExpenses } from "@/lib/sampleData";

export default function DashboardPage() {
  const { expenses, loading, addMany } = useExpenses();
  const { openAdd, openEdit, remove, openExport } = useEditor();
  const toast = useToast();

  const today = todayISO();
  const summary = useMemo(() => summarize(expenses, today), [expenses, today]);
  const months = useMemo(() => monthlyTotals(expenses, 6, today), [expenses, today]);
  const recent = useMemo(() => sortExpenses(expenses).slice(0, 5), [expenses]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">An overview of where your money goes.</p>
        </div>
        <button className="btn-secondary" onClick={() => openExport()} disabled={loading || expenses.length === 0}>
          <span aria-hidden>⇩</span> Export data…
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
          <Skeleton className="h-72 sm:col-span-2" />
          <Skeleton className="h-72 sm:col-span-2" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No expenses yet"
            message="Add your first expense to see summaries and charts, or load some sample data to explore the app."
          >
            <button className="btn-primary" onClick={openAdd}>Add expense</button>
            <button
              className="btn-secondary"
              onClick={() => {
                const sample = generateSampleExpenses();
                addMany(sample);
                toast(`Loaded ${sample.length} sample expenses.`);
              }}
            >
              Load sample data
            </button>
          </EmptyState>
        </div>
      ) : (
        <>
          <SummaryCards s={summary} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="mb-4 font-semibold">Spending by category</h2>
              <CategoryDonut data={summary.byCategory} />
            </section>
            <section className="card p-5">
              <h2 className="mb-4 font-semibold">Last 6 months</h2>
              <MonthlyBars data={months} />
            </section>
          </div>
          <section className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Recent expenses</h2>
              <Link href="/expenses" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all →
              </Link>
            </div>
            <ExpenseList expenses={recent} onEdit={openEdit} onDelete={remove} />
          </section>
        </>
      )}
    </>
  );
}
