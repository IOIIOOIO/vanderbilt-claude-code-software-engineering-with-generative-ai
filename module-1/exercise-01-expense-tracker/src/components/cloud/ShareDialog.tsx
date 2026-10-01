"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Modal } from "../Modal";
import { useCloud } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { getTemplate, type TemplateId } from "@/lib/cloud/templates";
import { EXPIRY_OPTIONS, encodeShare } from "@/lib/cloud/share";
import { Spinner } from "./Primitives";

/** Creates a working, serverless read-only link (data lives in the URL fragment) plus a QR code. */
export function ShareDialog({ templateId, onClose }: { templateId: TemplateId; onClose: () => void }) {
  const { buildArtifact } = useCloud();
  const toast = useToast();
  const artifact = useMemo(() => buildArtifact(templateId), [buildArtifact, templateId]);
  const [expiry, setExpiry] = useState<(typeof EXPIRY_OPTIONS)[number]["id"]>("7d");
  const [sharedBy, setSharedBy] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Any option change invalidates the generated link.
  useEffect(() => {
    setLink(null);
    setQr(null);
  }, [expiry, sharedBy, note]);

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const ms = EXPIRY_OPTIONS.find((o) => o.id === expiry)!.ms;
      const token = await encodeShare({
        v: 1,
        title: artifact.title,
        createdAt: new Date().toISOString(),
        expiresAt: ms === null ? null : new Date(Date.now() + ms).toISOString(),
        sharedBy: sharedBy.trim(),
        note: note.trim(),
        columns: artifact.table.columns,
        rows: artifact.table.rows,
      });
      const url = `${window.location.origin}/shared#${token}`;
      setLink(url);
      try {
        setQr(await QRCode.toDataURL(url, { margin: 1, width: 220, errorCorrectionLevel: "L" }));
      } catch {
        setQr(null); // Too much data for a QR code; the link still works.
      }
    } catch {
      setError("Couldn't create a link in this browser.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy failed. Select the link and copy it manually.", "error");
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <Modal open title="Share a read-only link" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-gradient-to-br from-brand-50 to-sky-50 p-3 text-sm text-slate-700">
          <p className="font-medium text-slate-900">{artifact.title}</p>
          <p className="text-xs text-slate-500">
            {artifact.table.rows.length} rows. The data is packed into the link itself, so nothing is uploaded to a server.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="share-expiry" className="label">Link expires</label>
            <select id="share-expiry" className="input" value={expiry} onChange={(e) => setExpiry(e.target.value as typeof expiry)}>
              {EXPIRY_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="share-by" className="label">Shared by (optional)</label>
            <input id="share-by" className="input" placeholder="Your name" value={sharedBy} onChange={(e) => setSharedBy(e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="share-note" className="label">Note for viewers (optional)</label>
          <input id="share-note" className="input" placeholder="Q3 numbers for review" value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} />
        </div>

        {!link ? (
          <button className="btn-primary w-full" onClick={generate} disabled={busy}>
            {busy ? <><Spinner /> Generating…</> : "🔗 Generate link"}
          </button>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row" data-testid="share-result">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR code for the share link" className="mx-auto h-36 w-36 rounded-lg border border-slate-100 sm:mx-0" />
            ) : (
              <div className="mx-auto grid h-36 w-36 place-items-center rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500 sm:mx-0">
                Too much data for a QR code. Use the link instead.
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <input readOnly value={link} aria-label="Share link" className="input font-mono text-xs" onFocus={(e) => e.target.select()} />
              <p className="text-xs text-slate-500">{link.length.toLocaleString()} characters · anyone with the link can view</p>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" onClick={copy}>{copied ? "✓ Copied" : "Copy link"}</button>
                <a className="btn-secondary" href={link} target="_blank" rel="noreferrer">Open ↗</a>
                {canNativeShare && (
                  <button className="btn-secondary" onClick={() => navigator.share({ title: artifact.title, url: link }).catch(() => {})}>Share…</button>
                )}
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-slate-400">
          Template: {getTemplate(templateId).name}. Expiry is checked when the link is opened. Because the data lives in the link, anyone who already has a copy can still decode it.
        </p>
      </div>
    </Modal>
  );
}
