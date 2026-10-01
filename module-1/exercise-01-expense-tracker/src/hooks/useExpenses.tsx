"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Expense, ExpenseInput } from "@/lib/types";
import { loadExpenses, newId, saveExpenses, STORAGE_KEY } from "@/lib/storage";

interface ExpensesContextValue {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  addExpense: (input: ExpenseInput) => void;
  addMany: (inputs: ExpenseInput[]) => void;
  updateExpense: (id: string, input: ExpenseInput) => void;
  deleteExpense: (id: string) => Expense | undefined;
  restoreExpense: (expense: Expense) => void;
  clearAll: () => void;
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load once on mount (localStorage is only available in the browser).
  useEffect(() => {
    try {
      setExpenses(loadExpenses());
    } catch {
      setError("Saved data couldn't be read. Starting with an empty list.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep other open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        setExpenses(loadExpenses());
      } catch {
        /* ignore malformed external writes */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((updater: (prev: Expense[]) => Expense[]) => {
    setExpenses((prev) => {
      const next = updater(prev);
      try {
        saveExpenses(next);
        setError(null);
      } catch {
        setError("Couldn't save to browser storage. It may be full or disabled.");
      }
      return next;
    });
  }, []);

  const value = useMemo<ExpensesContextValue>(() => {
    const create = (input: ExpenseInput): Expense => ({
      ...input,
      id: newId(),
      createdAt: new Date().toISOString(),
    });
    return {
      expenses,
      loading,
      error,
      addExpense: (input) => commit((prev) => [...prev, create(input)]),
      addMany: (inputs) => commit((prev) => [...prev, ...inputs.map(create)]),
      updateExpense: (id, input) =>
        commit((prev) => prev.map((e) => (e.id === id ? { ...e, ...input } : e))),
      deleteExpense: (id) => {
        const removed = expenses.find((e) => e.id === id);
        commit((prev) => prev.filter((e) => e.id !== id));
        return removed;
      },
      restoreExpense: (expense) =>
        commit((prev) => (prev.some((e) => e.id === expense.id) ? prev : [...prev, expense])),
      clearAll: () => commit(() => []),
    };
  }, [expenses, loading, error, commit]);

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

export function useExpenses(): ExpensesContextValue {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error("useExpenses must be used inside <ExpensesProvider>.");
  return ctx;
}
