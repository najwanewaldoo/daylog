"use client";

import React, { useState, useEffect } from "react";
import { RatingScale } from "@/components/ui/RatingScale";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Check, AlertCircle, Clock, Moon, BookOpen } from "lucide-react";
import type { DailyCheckinData } from "@/types";

interface CheckinFormProps {
  initialDate: string;
  initialData?: DailyCheckinData | null;
  onSaved?: (saved: DailyCheckinData) => void;
  onDateChange?: (newDate: string) => void;
}

export function CheckinForm({
  initialDate,
  initialData,
  onSaved,
  onDateChange,
}: CheckinFormProps) {
  const [entryDate, setEntryDate] = useState(initialDate);
  const [sleepHours, setSleepHours] = useState<number>(initialData?.sleepHours ?? 7.5);
  const [sleepQuality, setSleepQuality] = useState<number>(initialData?.sleepQuality ?? 3);
  const [energy, setEnergy] = useState<number>(initialData?.energy ?? 3);
  const [mood, setMood] = useState<number>(initialData?.mood ?? 3);
  const [focus, setFocus] = useState<number>(initialData?.focus ?? 3);
  const [workload, setWorkload] = useState<number>(initialData?.workload ?? 3);
  const [studyMinutes, setStudyMinutes] = useState<number>(initialData?.studyMinutes ?? 120);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      setSleepHours(initialData.sleepHours);
      setSleepQuality(initialData.sleepQuality);
      setEnergy(initialData.energy);
      setMood(initialData.mood);
      setFocus(initialData.focus);
      setWorkload(initialData.workload);
      setStudyMinutes(initialData.studyMinutes);
    } else {
      setSleepHours(7.5);
      setSleepQuality(3);
      setEnergy(3);
      setMood(3);
      setFocus(3);
      setWorkload(3);
      setStudyMinutes(120);
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
        sleepHours: Number(sleepHours),
        sleepQuality: Number(sleepQuality),
        energy: Number(energy),
        mood: Number(mood),
        focus: Number(focus),
        workload: Number(workload),
        studyMinutes: Number(studyMinutes),
      };

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save check-in");
      }

      setMessage({ type: "success", text: "Daily check-in saved." });
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
            <CardTitle>Daily Quantitative Check-in</CardTitle>
            <CardDescription>
              Record your conditions and study habits for {entryDate}.
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

          {/* Sleep Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-canvas-subtle/50 border border-canvas-borderLight">
            <div>
              <label className="block text-sm font-medium text-ink flex items-center gap-1.5 mb-1">
                <Moon className="w-4 h-4 text-slateBlue-500" />
                Sleep Duration (Hours)
              </label>
              <p className="text-xs text-ink-muted mb-2">
                Total hours of sleep last night (0–24, decimals allowed)
              </p>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink focus:outline-none focus:ring-2 focus:ring-ink"
              />
            </div>

            <div>
              <RatingScale
                label="Sleep Quality"
                description="How restorative was your sleep?"
                value={sleepQuality}
                onChange={setSleepQuality}
              />
            </div>
          </div>

          {/* Internal States */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Daily Capacities & Demands
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <RatingScale
                label="Energy Level"
                description="Physical and mental vitality today"
                value={energy}
                onChange={setEnergy}
              />

              <RatingScale
                label="Mood"
                description="General emotional outlook"
                value={mood}
                onChange={setMood}
              />

              <RatingScale
                label="Focus & Attention"
                description="Ability to concentrate and resist distraction"
                value={focus}
                onChange={setFocus}
              />

              <RatingScale
                label="Academic Workload"
                description="Volume and difficulty of academic demands"
                value={workload}
                onChange={setWorkload}
                variant="workload"
              />
            </div>
          </div>

          {/* Study Duration */}
          <div className="p-4 rounded-xl bg-canvas-subtle/50 border border-canvas-borderLight">
            <label className="block text-sm font-medium text-ink flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-sage-600" />
              Independent Study Duration (Minutes)
            </label>
            <p className="text-xs text-ink-muted mb-2">
              Time spent in focused, independent study (excluding passive attendance)
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="1440"
                step="15"
                value={studyMinutes}
                onChange={(e) => setStudyMinutes(parseInt(e.target.value, 10) || 0)}
                required
                className="w-40 px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink focus:outline-none focus:ring-2 focus:ring-ink"
              />
              <span className="text-xs text-ink-muted">
                ≈ {(studyMinutes / 60).toFixed(1)} hours
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-canvas-borderLight">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : initialData ? "Update Check-in" : "Save Daily Check-in"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
