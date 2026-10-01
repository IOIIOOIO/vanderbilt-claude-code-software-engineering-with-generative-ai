/**
 * Serverless share links.
 *
 * The report snapshot is compressed (deflate) and base64url-encoded into the URL *fragment*.
 * Fragments are never sent to a server, so the data only travels inside the link itself,
 * yet anyone with the link can open a read-only view at /shared.
 */

export interface SharePayload {
  v: 1;
  title: string;
  createdAt: string;
  /** ISO timestamp after which the viewer refuses to render. Null = never. */
  expiresAt: string | null;
  sharedBy: string;
  note: string;
  columns: string[];
  rows: (string | number)[][];
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeShare(payload: SharePayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  return toBase64Url(await pipe(json, new CompressionStream("deflate-raw")));
}

export async function decodeShare(token: string): Promise<SharePayload> {
  const bytes = await pipe(fromBase64Url(token), new DecompressionStream("deflate-raw"));
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (data?.v !== 1 || !Array.isArray(data.columns) || !Array.isArray(data.rows)) {
    throw new Error("This link is not a valid Spendwise share.");
  }
  return data as SharePayload;
}

export function isExpired(p: SharePayload, now: Date = new Date()): boolean {
  return p.expiresAt !== null && new Date(p.expiresAt) <= now;
}

export const EXPIRY_OPTIONS = [
  { id: "1h", label: "1 hour", ms: 3_600_000 },
  { id: "1d", label: "24 hours", ms: 86_400_000 },
  { id: "7d", label: "7 days", ms: 7 * 86_400_000 },
  { id: "never", label: "Never", ms: null },
] as const;
