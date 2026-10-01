"use client";

import { useEffect, useState } from "react";
import { Modal } from "../Modal";
import { useCloud } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { getDestination, type DestinationId } from "@/lib/cloud/integrations";
import { BrandLogo, Spinner } from "./Primitives";

type Step = "redirect" | "consent" | "finishing";

/**
 * Simulated OAuth flow: "redirect" to the provider, a consent screen listing scopes,
 * then the token exchange. No real credentials are requested or stored.
 */
export function ConnectDialog({ id, onClose, onConnected }: { id: DestinationId | null; onClose: () => void; onConnected?: () => void }) {
  const { connect } = useCloud();
  const toast = useToast();
  const [step, setStep] = useState<Step>("redirect");
  const [account, setAccount] = useState("you@example.com");
  const [url, setUrl] = useState("https://hooks.zapier.com/hooks/catch/123/abc");
  const dest = id ? getDestination(id) : null;
  const isWebhook = id === "webhook";

  useEffect(() => {
    if (!id) return;
    setStep(isWebhook ? "consent" : "redirect");
    if (isWebhook) return;
    const t = setTimeout(() => setStep("consent"), 900);
    return () => clearTimeout(t);
  }, [id, isWebhook]);

  if (!dest) return null;

  const urlValid = /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(url);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account);

  const allow = () => {
    setStep("finishing");
    setTimeout(() => {
      connect(dest.id, isWebhook ? new URL(url).host : account, isWebhook ? { url } : undefined);
      toast(`${dest.name} connected.`);
      onConnected?.();
      onClose();
    }, 800);
  };

  return (
    <Modal open title={isWebhook ? "Add webhook" : `Connect ${dest.name}`} onClose={onClose}>
      {step === "redirect" && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-600 text-lg font-bold text-white">$</span>
            <span className="flex gap-1 text-slate-300"><Dot /><Dot d="150ms" /><Dot d="300ms" /></span>
            <BrandLogo id={dest.id} size="lg" />
          </div>
          <p className="text-sm text-slate-600">Redirecting you to {dest.name} to sign in securely…</p>
        </div>
      )}

      {step !== "redirect" && isWebhook && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Every export sent here is delivered as a signed <code className="rounded bg-slate-100 px-1">POST</code> with a JSON body. Works with Zapier, Make, n8n or your own API.
          </p>
          <div>
            <label htmlFor="webhook-url" className="label">Endpoint URL</label>
            <input id="webhook-url" className={`input font-mono text-xs ${url && !urlValid ? "input-error" : ""}`} value={url} onChange={(e) => setUrl(e.target.value)} />
            {url && !urlValid && <p className="mt-1 text-xs text-red-600">Must be an https:// URL.</p>}
          </div>
          <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">{`POST ${urlValid ? new URL(url).pathname : "/…"}
X-Spendwise-Signature: sha256=…
Content-Type: application/json

{
  "event": "export.completed",
  "template": "monthly-summary",
  "records": 42,
  "data": { "columns": [...], "rows": [...] }
}`}</pre>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={!urlValid || step === "finishing"} onClick={allow}>
              {step === "finishing" ? <><Spinner /> Verifying…</> : "Save webhook"}
            </button>
          </div>
        </div>
      )}

      {step !== "redirect" && !isWebhook && (
        // Styled to resemble a provider's consent screen.
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span aria-hidden>🔒</span>
            <span className="truncate font-mono">accounts.{dest.id.replace("google-", "google")}.com/oauth/authorize</span>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <BrandLogo id={dest.id} />
              <div>
                <p className="font-semibold text-slate-900">Spendwise wants to access your {dest.name} account</p>
                <p className="text-xs text-slate-500">Simulated sign-in: no real credentials are used.</p>
              </div>
            </div>
            <div>
              <label htmlFor="oauth-account" className="label">Account</label>
              <input id="oauth-account" className={`input ${account && !emailValid ? "input-error" : ""}`} value={account} onChange={(e) => setAccount(e.target.value)} />
            </div>
            <div>
              <p className="label">This will allow Spendwise to</p>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {dest.scopes.map((s) => (
                  <li key={s} className="flex gap-2"><span className="text-emerald-600">✓</span>{s}</li>
                ))}
                <li className="flex gap-2 text-slate-400"><span>✕</span>It cannot read your other files or messages</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" disabled={!emailValid || step === "finishing"} onClick={allow}>
                {step === "finishing" ? <><Spinner /> Connecting…</> : "Allow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Dot({ d = "0ms" }: { d?: string }) {
  return <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: d }} />;
}
