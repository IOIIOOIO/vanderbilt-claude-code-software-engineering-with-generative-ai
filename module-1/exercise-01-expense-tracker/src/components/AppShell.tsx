"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Expense } from "@/lib/types";
import { ExpensesProvider, useExpenses } from "@/hooks/useExpenses";
import { ToastProvider, useToast } from "@/hooks/useToast";
import { Nav } from "./Nav";
import { Modal } from "./Modal";
import { ExpenseForm } from "./ExpenseForm";
import { ErrorBanner } from "./States";
import { usePathname } from "next/navigation";
import { CloudProvider } from "@/hooks/useCloud";
import { ActivityTray } from "./cloud/ActivityTray";

interface EditorContextValue {
  openAdd: () => void;
  openEdit: (e: Expense) => void;
  remove: (e: Expense) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside <AppShell>.");
  return ctx;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  // Public share links render standalone: no nav, and none of the owner's data is loaded.
  if (usePathname().startsWith("/shared")) return <>{children}</>;
  return (
    <ToastProvider>
      <ExpensesProvider>
        <CloudProvider>
          <Shell>{children}</Shell>
          <ActivityTray />
        </CloudProvider>
      </ExpensesProvider>
    </ToastProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { addExpense, updateExpense, deleteExpense, restoreExpense, error } = useExpenses();
  const toast = useToast();
  // undefined = closed, null = adding, Expense = editing
  const [editing, setEditing] = useState<Expense | null | undefined>(undefined);
  const close = useCallback(() => setEditing(undefined), []);

  const editor = useMemo<EditorContextValue>(
    () => ({
      openAdd: () => setEditing(null),
      openEdit: (e) => setEditing(e),
      remove: (e) => {
        const removed = deleteExpense(e.id);
        if (removed) {
          toast(`Deleted “${removed.description}”.`, "info", {
            label: "Undo",
            onClick: () => restoreExpense(removed),
          });
        }
      },
    }),
    [deleteExpense, restoreExpense, toast],
  );

  return (
    <EditorContext.Provider value={editor}>
      <Nav onAdd={editor.openAdd} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        {error && <ErrorBanner message={error} />}
        {children}
      </main>
      <Modal open={editing !== undefined} title={editing ? "Edit expense" : "Add expense"} onClose={close}>
        {editing !== undefined && (
          <ExpenseForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            onCancel={close}
            onSubmit={(data) => {
              if (editing) {
                updateExpense(editing.id, data);
                toast("Expense updated.");
              } else {
                addExpense(data);
                toast("Expense added.");
              }
              close();
            }}
          />
        )}
      </Modal>
    </EditorContext.Provider>
  );
}
