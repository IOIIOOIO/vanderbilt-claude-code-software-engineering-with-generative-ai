"use client";

import { useState } from "react";
import { useCloud } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { DESTINATIONS, type Destination, type DestinationId } from "@/lib/cloud/integrations";
import { relativeTime } from "@/lib/cloud/schedule";
import { BrandLogo, Pill, Toggle } from "./Primitives";
import { ConnectDialog } from "./ConnectDialog";

const GROUPS: { kind: Destination["kind"]; title: string; blurb: string }[] = [
  { kind: "storage", title: "Cloud storage", blurb: "Keep an always-current backup of your data." },
  { kind: "productivity", title: "Productivity", blurb: "Send reports where you already plan and review." },
  { kind: "messaging", title: "Messaging", blurb: "Deliver reports to people and channels." },
  { kind: "developer", title: "Developer", blurb: "Automate anything with raw data." },
];

export function IntegrationsPanel() {
  const { connections, disconnect, setAutoSync, syncing } = useCloud();
  const toast = useToast();
  const [connecting, setConnecting] = useState<DestinationId | null>(null);

  return (
    <div className="space-y-8">
      {GROUPS.map((g) => (
        <section key={g.kind}>
          <div className="mb-3">
            <h2 className="font-semibold text-slate-900">{g.title}</h2>
            <p className="text-sm text-slate-500">{g.blurb}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {DESTINATIONS.filter((d) => d.kind === g.kind).map((d) => {
              const c = connections[d.id];
              const needsSetup = d.requiresAuth || d.id === "webhook";
              return (
                <div key={d.id} className="card flex flex-col gap-3 p-4" data-testid={`integration-${d.id}`}>
                  <div className="flex items-start gap-3">
                    <BrandLogo id={d.id} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{d.name}</p>
                        {c ? <Pill tone="green">● Connected</Pill> : !needsSetup ? <Pill tone="slate">Built-in</Pill> : null}
                      </div>
                      <p className="text-sm text-slate-500">{d.description}</p>
                      {c && <p className="mt-1 truncate text-xs text-slate-500">as <span className="font-medium text-slate-700">{c.account}</span></p>}
                    </div>
                  </div>

                  {c && g.kind === "storage" && (
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <div className="text-xs">
                        <p className="font-medium text-slate-900">Auto-sync backup</p>
                        <p className="text-slate-500">
                          {c.autoSync
                            ? syncing
                              ? "Syncing changes…"
                              : c.lastSyncAt
                                ? `Up to date · ${relativeTime(new Date(c.lastSyncAt))}`
                                : "Waiting for first change"
                            : "Off"}
                        </p>
                      </div>
                      <Toggle
                        label={`Auto-sync to ${d.name}`}
                        checked={c.autoSync}
                        onChange={(on) => {
                          setAutoSync(d.id, on);
                          toast(on ? `Auto-sync to ${d.name} on. Changes back up within seconds.` : `Auto-sync to ${d.name} off.`, "info");
                        }}
                      />
                    </div>
                  )}

                  {needsSetup && (
                    <div className="mt-auto flex justify-end">
                      {c ? (
                        <button className="text-sm font-medium text-red-600 hover:text-red-700" onClick={() => { disconnect(d.id); toast(`${d.name} disconnected.`, "info"); }}>
                          Disconnect
                        </button>
                      ) : (
                        <button className="btn-secondary" onClick={() => setConnecting(d.id)}>Connect</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <p className="text-xs text-slate-400">
        Integrations are simulated for this demo. Connection state is saved in your browser and no data leaves the device, except through share links you create.
      </p>
      {connecting && <ConnectDialog id={connecting} onClose={() => setConnecting(null)} />}
    </div>
  );
}
