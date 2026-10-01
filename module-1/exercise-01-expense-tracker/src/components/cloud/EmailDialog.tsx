"use client";

import { useMemo, useState } from "react";
import { Modal } from "../Modal";
import { useCloud, type HistoryEntry } from "@/hooks/useCloud";
import { getTemplate, type TemplateId } from "@/lib/cloud/templates";
import { formatBytes, Spinner } from "./Primitives";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Simulated "send by email" flow: compose → background job → delivered receipt. */
export function EmailDialog({ templateId, onClose }: { templateId: TemplateId; onClose: () => void }) {
  const { buildArtifact, runExport } = useCloud();
  const template = getTemplate(templateId);
  const artifact = useMemo(() => buildArtifact(templateId), [buildArtifact, templateId]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState(`${artifact.title} from Spendwise`);
  const [message, setMessage] = useState(`Hi,\n\nAttached is my ${template.name.toLowerCase()} (${artifact.recordCount} records).\n\nThanks!`);
  const [status, setStatus] = useState<"compose" | "sending" | "sent">("compose");
  const [receipt, setReceipt] = useState<HistoryEntry | null>(null);
  const [error, setError] = useState("");

  const addDraft = () => {
    const parts = draft.split(/[,;\s]+/).filter(Boolean);
    const bad = parts.filter((p) => !EMAIL.test(p));
    setRecipients((r) => [...new Set([...r, ...parts.filter((p) => EMAIL.test(p))])]);
    setDraft(bad.join(" "));
    setError(bad.length ? `Not a valid email: ${bad.join(", ")}` : "");
  };

  const send = async () => {
    if (draft.trim()) addDraft();
    const all = [...new Set([...recipients, ...draft.split(/[,;\s]+/).filter((p) => EMAIL.test(p))])];
    if (!all.length) return setError("Add at least one recipient.");
    setStatus("sending");
    const entry = await runExport(templateId, "email", { recipients: all, message });
    if (entry.status === "failed") {
      setStatus("compose");
      setError(entry.error ?? "Sending failed.");
    } else {
      setReceipt(entry);
      setStatus("sent");
    }
  };

  return (
    <Modal open title={status === "sent" ? "Email sent" : "Email export"} onClose={onClose}>
      {status === "sent" && receipt ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl">✓</div>
          <p className="font-semibold text-slate-900">Delivered to {receipt.recipients?.length} recipient{receipt.recipients?.length === 1 ? "" : "s"}</p>
          <p className="text-sm text-slate-500">{receipt.recipients?.join(", ")}</p>
          <p className="max-w-sm text-xs text-slate-400">Simulated delivery. In production this would go through a transactional email service with delivery and open tracking.</p>
          <button className="btn-primary mt-2" onClick={onClose}>Done</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label htmlFor="email-to" className="label">To</label>
            <div className={`flex flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand-500/20 ${error ? "border-red-400" : "border-slate-300"}`}>
              {recipients.map((r) => (
                <span key={r} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {r}
                  <button aria-label={`Remove ${r}`} onClick={() => setRecipients((x) => x.filter((y) => y !== r))}>✕</button>
                </span>
              ))}
              <input
                id="email-to"
                className="min-w-[10rem] flex-1 py-0.5 text-sm outline-none"
                placeholder={recipients.length ? "" : "accountant@firm.com"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => draft.trim() && addDraft()}
                onKeyDown={(e) => {
                  if (["Enter", ",", " ", "Tab"].includes(e.key) && draft.trim()) {
                    if (e.key !== "Tab") e.preventDefault();
                    addDraft();
                  } else if (e.key === "Backspace" && !draft) setRecipients((r) => r.slice(0, -1));
                }}
              />
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
          <div>
            <label htmlFor="email-subject" className="label">Subject</label>
            <input id="email-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email-body" className="label">Message</label>
            <textarea id="email-body" rows={5} className="input resize-none" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-xl" aria-hidden>📎</span>
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium text-slate-900">{artifact.filename}</p>
              <p className="text-xs text-slate-500">{formatBytes(new Blob([artifact.content]).size)} · {artifact.recordCount} records</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-secondary" onClick={onClose} disabled={status === "sending"}>Cancel</button>
            <button className="btn-primary" onClick={send} disabled={status === "sending"}>
              {status === "sending" ? <><Spinner /> Sending…</> : "Send"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
