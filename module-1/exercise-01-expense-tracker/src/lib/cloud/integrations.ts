export type DestinationId =
  | "download"
  | "email"
  | "google-sheets"
  | "google-drive"
  | "dropbox"
  | "onedrive"
  | "notion"
  | "slack"
  | "webhook";

export interface Destination {
  id: DestinationId;
  name: string;
  /** Short monogram + brand colour used as a logo stand-in. */
  mono: string;
  color: string;
  kind: "local" | "storage" | "productivity" | "messaging" | "developer";
  description: string;
  /** Requires a (simulated) OAuth connection before use. */
  requiresAuth: boolean;
  /** What the consent screen says it will access. */
  scopes: string[];
  /** Pipeline stages shown while a job runs. */
  stages: string[];
  /** Where the result "lands", for the history log. */
  locationLabel: (filename: string) => string;
}

export const DESTINATIONS: Destination[] = [
  {
    id: "download", name: "Download", mono: "⇩", color: "#475569", kind: "local",
    description: "Save the file to this device", requiresAuth: false, scopes: [],
    stages: ["Generating file", "Preparing download"],
    locationLabel: (f) => `Downloads/${f}`,
  },
  {
    id: "email", name: "Email", mono: "✉", color: "#0ea5e9", kind: "messaging",
    description: "Send as an attachment to anyone", requiresAuth: false, scopes: [],
    stages: ["Generating file", "Attaching", "Sending", "Delivered"],
    locationLabel: () => "Email",
  },
  {
    id: "google-sheets", name: "Google Sheets", mono: "GS", color: "#0f9d58", kind: "productivity",
    description: "Create a live spreadsheet in your Drive", requiresAuth: true,
    scopes: ["Create spreadsheets in your Google Drive", "Edit spreadsheets created by Spendwise"],
    stages: ["Generating data", "Creating spreadsheet", "Writing rows", "Applying formatting"],
    locationLabel: (f) => `Google Sheets › Spendwise › ${f.replace(/\.\w+$/, "")}`,
  },
  {
    id: "google-drive", name: "Google Drive", mono: "GD", color: "#4285f4", kind: "storage",
    description: "Upload to a Spendwise folder in Drive", requiresAuth: true,
    scopes: ["See and upload files Spendwise creates in your Drive"],
    stages: ["Generating file", "Uploading", "Verifying checksum"],
    locationLabel: (f) => `My Drive › Spendwise › ${f}`,
  },
  {
    id: "dropbox", name: "Dropbox", mono: "DB", color: "#0061ff", kind: "storage",
    description: "Sync to /Apps/Spendwise", requiresAuth: true,
    scopes: ["Read and write files in /Apps/Spendwise only"],
    stages: ["Generating file", "Uploading", "Verifying checksum"],
    locationLabel: (f) => `Dropbox › Apps › Spendwise › ${f}`,
  },
  {
    id: "onedrive", name: "OneDrive", mono: "OD", color: "#0078d4", kind: "storage",
    description: "Save to OneDrive for personal or work", requiresAuth: true,
    scopes: ["Read and write files in the Spendwise app folder"],
    stages: ["Generating file", "Uploading", "Verifying checksum"],
    locationLabel: (f) => `OneDrive › Apps › Spendwise › ${f}`,
  },
  {
    id: "notion", name: "Notion", mono: "N", color: "#111827", kind: "productivity",
    description: "Append a database page with the report", requiresAuth: true,
    scopes: ["Insert content into pages you select"],
    stages: ["Generating data", "Creating page", "Inserting table"],
    locationLabel: () => "Notion › Finance › Spendwise reports",
  },
  {
    id: "slack", name: "Slack", mono: "#", color: "#4a154b", kind: "messaging",
    description: "Post a summary and file to a channel", requiresAuth: true,
    scopes: ["Post messages to channels you choose", "Upload files"],
    stages: ["Generating file", "Uploading", "Posting message"],
    locationLabel: () => "Slack › #finance",
  },
  {
    id: "webhook", name: "Webhook", mono: "{ }", color: "#7c3aed", kind: "developer",
    description: "POST JSON to your own endpoint (Zapier, Make, n8n…)", requiresAuth: false, scopes: [],
    stages: ["Generating payload", "Signing request", "Delivering"],
    locationLabel: () => "Webhook endpoint",
  },
];

export const getDestination = (id: DestinationId) => DESTINATIONS.find((d) => d.id === id)!;
