"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, AlertCircle, Heart, Sparkles, Mountain, Feather } from "lucide-react";
import type { JournalEntryData } from "@/types";

interface JournalFormProps {
  initialDate: string;
  initialData?: JournalEntryData | null;
  onSaved?: (saved: JournalEntryData) => void;
  onDateChange?: (newDate: string) => void;
}

export function JournalForm({
  initialDate,
  initialData,
  onSaved,
  onDateChange,
}: JournalFormProps) {
  const [entryDate, setEntryDate] = useState(initialDate);
  const [gratitude, setGratitude] = useState(initialData?.gratitude || "");
  const [wentWell, setWentWell] = useState(initialData?.wentWell || "");
  const [challenge, setChallenge] = useState(initialData?.challenge || "");
  const [freeText, setFreeText] = useState(initialData?.freeText || "");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      setGratitude(initialData.gratitude || "");
      setWentWell(initialData.wentWell || "");
      setChallenge(initialData.challenge || "");
      setFreeText(initialData.freeText || "");
    } else {
      setGratitude("");
      setWentWell("");
      setChallenge("");
      setFreeText("");
    }
    setEntryDate(initialDate);
    setMessage(null);
  }, [initialData, initialDate]);

  function handleDateChange(newDate: string) {
    setEntryDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        entryDate,
        gratitude: gratitude.trim() || null,
        wentWell: wentWell.trim() || null,
        challenge: challenge.trim() || null,
        freeText: freeText.trim() || null,
      };

      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save journal entry");
      }

      setMessage({ type: "success", text: "Journal entry saved." });
      if (onSaved && json.data) {
        onSaved(json.data);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-canvas-border">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Reflective Journal</CardTitle>
            <CardDescription>
              Qualitative context for {entryDate}. All fields are optional—write as much or as little as you need.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-muted">Date:</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-2 py-1 text-xs border border-canvas-border rounded bg-white text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Prompt 1: Gratitude */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-warmAmber-600" />
              Gratitude
            </label>
            <p className="text-xs text-ink-muted">
              What was grounding, comforting, or appreciated today?
            </p>
            <textarea
              rows={2}
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="A warm conversation, productive quiet morning, progress on a hard topic..."
              className="w-full px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          {/* Prompt 2: Went Well */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sage-600" />
              What Went Well
            </label>
            <p className="text-xs text-ink-muted">
              What efforts, methods, or small moments worked in your favor?
            </p>
            <textarea
              rows={2}
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="Started studying early, resolved a bug, understood a difficult concept..."
              className="w-full px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          {/* Prompt 3: Challenges */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink flex items-center gap-1.5">
              <Mountain className="w-4 h-4 text-slateBlue-500" />
              Challenges & Obstacles
            </label>
            <p className="text-xs text-ink-muted">
              What felt difficult, draining, or disruptive today?
            </p>
            <textarea
              rows={2}
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              placeholder="Heavy reading workload, afternoon fatigue, phone distraction..."
              className="w-full px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          {/* Prompt 4: Free Reflection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink flex items-center gap-1.5">
              <Feather className="w-4 h-4 text-ink-muted" />
              Free Reflection
            </label>
            <p className="text-xs text-ink-muted">
              Additional personal notes, observations about your learning rhythm, or thoughts.
            </p>
            <textarea
              rows={4}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Open space to write freely about your study sessions, headspace, or ideas..."
              className="w-full px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-canvas-borderLight">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : initialData ? "Update Journal Entry" : "Save Journal Entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
