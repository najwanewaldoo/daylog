"use client";

import React, { useState, useEffect } from "react";
import { CheckinForm } from "@/components/checkin/CheckinForm";
import { JournalForm } from "@/components/journal/JournalForm";
import { IntentionForm } from "@/components/journal/IntentionForm";
import { Button } from "@/components/ui/Button";
import { formatDateDisplay, cn, getTodayDateString } from "@/lib/utils";
import { BookOpen, CheckSquare, Target, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { DayRecord } from "@/types";

interface JournalPageClientProps {
  initialDate: string;
  initialRecord: DayRecord;
}

export function JournalPageClient({
  initialDate,
  initialRecord,
}: JournalPageClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [activeTab, setActiveTab] = useState<"checkin" | "journal" | "intention">("checkin");
  const [record, setRecord] = useState<DayRecord>(initialRecord);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate !== initialDate) {
      loadDateRecord(selectedDate);
    }
  }, [selectedDate]);

  async function loadDateRecord(date: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/day?date=${date}`);
      const json = await res.json();
      if (json.success) {
        setRecord(json.data);
      }
    } catch (err) {
      console.error("Failed to load date record:", err);
    } finally {
      setLoading(false);
    }
  }

  function handlePrevDay() {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  }

  function handleNextDay() {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-canvas-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Daily Journal & Check-in
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Track conditions, reflect on study experiences, and set clear intentions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handlePrevDay} aria-label="Previous day">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-canvas-border bg-white text-xs font-semibold text-ink shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-ink-subtle" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
          <Button size="sm" variant="ghost" onClick={handleNextDay} aria-label="Next day">
            <ChevronRight className="w-4 h-4" />
          </Button>
          {selectedDate !== getTodayDateString() && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setSelectedDate(getTodayDateString())}
            >
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-canvas-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("checkin")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all cursor-pointer",
            activeTab === "checkin"
              ? "border-ink text-ink font-semibold bg-white"
              : "border-transparent text-ink-muted hover:text-ink hover:bg-canvas-subtle"
          )}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Quantitative Check-in</span>
          {record.checkin && (
            <span className="w-1.5 h-1.5 rounded-full bg-sage-500 inline-block" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("journal")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all cursor-pointer",
            activeTab === "journal"
              ? "border-ink text-ink font-semibold bg-white"
              : "border-transparent text-ink-muted hover:text-ink hover:bg-canvas-subtle"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Reflective Journal</span>
          {record.journal &&
            (record.journal.gratitude ||
              record.journal.wentWell ||
              record.journal.challenge ||
              record.journal.freeText) && (
              <span className="w-1.5 h-1.5 rounded-full bg-sage-500 inline-block" />
            )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("intention")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all cursor-pointer",
            activeTab === "intention"
              ? "border-ink text-ink font-semibold bg-white"
              : "border-transparent text-ink-muted hover:text-ink hover:bg-canvas-subtle"
          )}
        >
          <Target className="w-4 h-4" />
          <span>Daily Intentions</span>
          {record.intention && (
            <span className="w-1.5 h-1.5 rounded-full bg-slateBlue-500 inline-block" />
          )}
        </button>
      </div>

      {/* Content Form */}
      <div>
        {loading ? (
          <div className="py-16 text-center text-xs text-ink-subtle">
            Loading date record...
          </div>
        ) : (
          <>
            {activeTab === "checkin" && (
              <CheckinForm
                key={`checkin-${selectedDate}`}
                initialDate={selectedDate}
                initialData={record.checkin}
                onDateChange={(d) => setSelectedDate(d)}
                onSaved={(updated) => {
                  setRecord((prev) => ({ ...prev, checkin: updated }));
                }}
              />
            )}

            {activeTab === "journal" && (
              <JournalForm
                key={`journal-${selectedDate}`}
                initialDate={selectedDate}
                initialData={record.journal}
                onDateChange={(d) => setSelectedDate(d)}
                onSaved={(updated) => {
                  setRecord((prev) => ({ ...prev, journal: updated }));
                }}
              />
            )}

            {activeTab === "intention" && (
              <IntentionForm
                key={`intention-${selectedDate}`}
                initialDate={selectedDate}
                initialData={record.intention}
                onDateChange={(d) => setSelectedDate(d)}
                onSaved={(updated) => {
                  setRecord((prev) => ({ ...prev, intention: updated }));
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
