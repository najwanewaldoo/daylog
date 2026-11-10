"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, AlertCircle, Target, Coffee, Calendar } from "lucide-react";
import { getTodayDateString } from "@/lib/utils";
import type { DailyIntentionData } from "@/types";

interface IntentionFormProps {
  initialDate: string;
  initialData?: DailyIntentionData | null;
  onSaved?: (saved: DailyIntentionData) => void;
  onDateChange?: (newDate: string) => void;
}

export function IntentionForm({
  initialDate,
  initialData,
  onSaved,
  onDateChange,
}: IntentionFormProps) {
  const [targetDate, setTargetDate] = useState(initialDate);
  const [learningPriority, setLearningPriority] = useState(
    initialData?.learningPriority || ""
  );
  const [recoveryAction, setRecoveryAction] = useState(
    initialData?.recoveryAction || ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (initialData) {
      setLearningPriority(initialData.learningPriority || "");
      setRecoveryAction(initialData.recoveryAction || "");
    } else {
      setLearningPriority("");
      setRecoveryAction("");
    }
    setTargetDate(initialDate);
    setMessage(null);
  }, [initialData, initialDate]);

  function handleDateChange(newDate: string) {
    setTargetDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  }

  function setToToday() {
    const today = getTodayDateString();
    handleDateChange(today);
  }

  function setToTomorrow() {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    handleDateChange(`${yyyy}-${mm}-${dd}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        targetDate,
        learningPriority: learningPriority.trim(),
        recoveryAction: recoveryAction.trim(),
      };

      const res = await fetch("/api/intention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save daily intention");
      }

      setMessage({ type: "success", text: "Daily intention saved." });
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Daily Intentions</CardTitle>
            <CardDescription>
              Align your mental energy with one primary academic goal and one restorative practice for {targetDate}.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-canvas-subtle p-0.5 rounded-lg border border-canvas-borderLight">
              <button
                type="button"
                onClick={setToToday}
                className="px-2 py-1 text-[11px] font-medium rounded hover:bg-white text-ink transition-colors cursor-pointer"
              >
                For Today
              </button>
              <button
                type="button"
                onClick={setToTomorrow}
                className="px-2 py-1 text-[11px] font-medium rounded hover:bg-white text-ink transition-colors cursor-pointer"
              >
                For Tomorrow (+1 Day)
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs text-ink-muted">Target:</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-2 py-1 text-xs border border-canvas-border rounded bg-white text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink flex items-center gap-1.5">
              <Target className="w-4 h-4 text-slateBlue-500" />
              Primary Learning Priority
            </label>
            <p className="text-xs text-ink-muted">
              What is the single most important learning goal for this day?
            </p>
            <input
              type="text"
              required
              value={learningPriority}
              onChange={(e) => setLearningPriority(e.target.value)}
              placeholder="e.g. Implement database schema and verify indexing, or complete Chapter 3 problem set"
              className="w-full px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-sage-600" />
              Recovery Action
            </label>
            <p className="text-xs text-ink-muted">
              What is one realistic, non-academic action to support mental recovery?
            </p>
            <input
              type="text"
              required
              value={recoveryAction}
              onChange={(e) => setRecoveryAction(e.target.value)}
              placeholder="e.g. 20-minute walk without headphones, offline reading before bed, cook a proper meal"
              className="w-full px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-canvas-borderLight">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : initialData ? "Update Intentions" : "Save Intentions"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
