"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Download,
  Trash2,
  ShieldCheck,
  Database,
  Info,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export function SettingsView() {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [seeding, setSeeding] = useState(false);

  async function handleDeleteAll() {
    if (deleteConfirmation !== "DELETE_ALL_DATA") {
      setMessage({
        type: "error",
        text: "Please type DELETE_ALL_DATA exactly to confirm deletion.",
      });
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete data");
      }

      setMessage({ type: "success", text: json.message });
      setDeleteConfirmation("");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setDeleting(false);
    }
  }

  async function handleSeedDemoData() {
    setSeeding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to seed demo data");
      setMessage({
        type: "success",
        text: "Demo dataset (7 realistic university student days) loaded successfully! Check Dashboard and Weekly Review.",
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-2 border-b border-canvas-border">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Settings & Privacy
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          Manage local storage, data portability, backups, and privacy assurances.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-sage-50 text-sage-700 border border-sage-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-4 h-4 shrink-0 text-sage-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Privacy Architecture Guarantee */}
      <Card className="border-canvas-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sage-600" />
            <CardTitle>Local-First & Privacy by Default</CardTitle>
          </div>
          <CardDescription>
            How Daylog protects your personal reflections and academic well-being data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-ink-muted leading-relaxed">
          <p>
            • <strong>No External Cloud:</strong> All journal entries, numeric ratings, and intentions are stored exclusively on your local machine in an isolated SQLite database file.
          </p>
          <p>
            • <strong>Zero Third-Party AI APIs:</strong> Weekly insights and pattern recognition are computed using 100% deterministic, explainable, rule-based algorithms. Your reflections are never transmitted to LLM providers or remote servers.
          </p>
          <p>
            • <strong>No Account Required:</strong> No cookies, no trackers, no telemetry, and no sign-up flow.
          </p>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="border-canvas-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-ink" />
            <CardTitle>Export Personal Data</CardTitle>
          </div>
          <CardDescription>
            Download your full history of check-ins, journals, and daily intentions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-ink-muted">
            You retain 100% ownership of your data. You can export complete records in JSON (for programmatic backup) or CSV (for spreadsheet analysis).
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/api/export?format=json" download>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Format</span>
              </Button>
            </a>
            <a href="/api/export?format=csv" download>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Format</span>
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Database Backup Guidance */}
      <Card className="border-canvas-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-slateBlue-600" />
            <CardTitle>Database Backup Guidance</CardTitle>
          </div>
          <CardDescription>
            Your data is stored in a Turso (libSQL) cloud database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-ink-muted leading-relaxed">
          <p>
            The connection is configured through the following environment variables:
          </p>
          <div className="p-2.5 rounded bg-canvas-subtle font-mono text-[11px] text-ink select-all border border-canvas-border">
            TURSO_DATABASE_URL / TURSO_AUTH_TOKEN
          </div>
          <p>
            To keep a personal copy of your data, use the JSON export above, or run <code className="bg-canvas-subtle px-1 py-0.5 rounded text-ink">npm run db:backup</code> from the project folder. Turso also offers point-in-time recovery from its dashboard.
          </p>
        </CardContent>
      </Card>

      {/* Optional Development Demo Dataset */}
      <Card className="border-canvas-border bg-canvas-cardMuted">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-warmAmber-600" />
            <CardTitle>Development Demo Dataset</CardTitle>
          </div>
          <CardDescription>
            Optionally populate 7 realistic university student days to preview the Weekly Review and charts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-ink-muted leading-relaxed">
            If you want to immediately explore how the Integrated Weekly Review connects study hours, sleep variations, and journal entries without waiting 7 days, you can load sample records with this button.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSeedDemoData}
            disabled={seeding}
            className="gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-warmAmber-600" />
            <span>{seeding ? "Populating..." : "Load Demo Dataset (7 Days)"}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone: Delete All Data */}
      <Card className="border-red-200 bg-red-50/20">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" />
            <CardTitle className="text-red-900">Delete All Personal Data</CardTitle>
          </div>
          <CardDescription className="text-red-700/80">
            Permanently erase all journal entries, daily check-ins, and intentions. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-ink-muted">
            To prevent accidental deletion, please type <strong className="font-mono text-red-700">DELETE_ALL_DATA</strong> below:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE_ALL_DATA"
              className="px-3 py-1.5 text-xs border border-red-300 rounded-lg bg-white text-ink focus:outline-none focus:ring-1 focus:ring-red-500 flex-1"
            />
            <Button
              variant="danger"
              size="sm"
              disabled={deleteConfirmation !== "DELETE_ALL_DATA" || deleting}
              onClick={handleDeleteAll}
            >
              {deleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
