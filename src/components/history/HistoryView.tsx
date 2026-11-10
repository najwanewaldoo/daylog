"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  FileText,
  Clock,
  Moon,
  Zap,
  Target,
  Coffee,
  X,
  Compass,
  ArrowUpRight,
} from "lucide-react";
import { formatDateDisplay, cn } from "@/lib/utils";
import type { DayRecord } from "@/types";

interface HistoryViewProps {
  initialYearMonth: string; // YYYY-MM
}

export function HistoryView({ initialYearMonth }: HistoryViewProps) {
  const [yearMonth, setYearMonth] = useState(initialYearMonth);
  const [monthData, setMonthData] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [directRecord, setDirectRecord] = useState<DayRecord | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchMonthData(yearMonth);
  }, [yearMonth]);

  async function fetchMonthData(ym: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?month=${ym}`);
      const json = await res.json();
      if (json.success) {
        setMonthData(json.data);
      }
    } catch (err) {
      console.error("Failed to load month history:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectDate(dateStr: string) {
    setSelectedDate(dateStr);
    const targetYm = dateStr.slice(0, 7);
    if (targetYm !== yearMonth) {
      setYearMonth(targetYm);
    }

    // Check if in current month records
    const found = monthData.find((d) => d.date === dateStr);
    if (found) {
      setDirectRecord(found);
    } else {
      try {
        const res = await fetch(`/api/day?date=${dateStr}`);
        const json = await res.json();
        if (json.success) {
          setDirectRecord(json.data);
        }
      } catch (err) {
        console.error("Error loading day:", err);
      }
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/history/search?q=${encodeURIComponent(searchQuery)}`
      );
      const json = await res.json();
      if (json.success) {
        setSearchResults(json.data);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  function handlePrevMonth() {
    const [y, m] = yearMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newY = prevDate.getFullYear();
    const newM = String(prevDate.getMonth() + 1).padStart(2, "0");
    setYearMonth(`${newY}-${newM}`);
  }

  function handleNextMonth() {
    const [y, m] = yearMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const newY = nextDate.getFullYear();
    const newM = String(nextDate.getMonth() + 1).padStart(2, "0");
    setYearMonth(`${newY}-${newM}`);
  }

  // Build calendar matrix for current yearMonth
  const [curYear, curMonth] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(curYear, curMonth, 0).getDate();
  const firstDayOfWeek = new Date(curYear, curMonth - 1, 1).getDay(); // 0 is Sun

  const dayRecordsMap = new Map<string, DayRecord>();
  for (const item of monthData) {
    dayRecordsMap.set(item.date, item);
  }

  const selectedRecord = selectedDate
    ? directRecord && directRecord.date === selectedDate
      ? directRecord
      : dayRecordsMap.get(selectedDate)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-canvas-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            History & Archive
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Browse monthly calendars, search previous reflections, and inspect daily details.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search journal entries..."
              className="pl-8 pr-3 py-1.5 text-xs border border-canvas-border rounded-lg bg-white text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-ink w-52 sm:w-64"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
          {isSearching && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                setIsSearching(false);
                setSearchResults([]);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </form>
      </div>

      {/* Search results view */}
      {isSearching && (
        <Card className="border-canvas-border">
          <CardHeader>
            <CardTitle className="text-sm">
              Search Results for &ldquo;{searchQuery}&rdquo; ({searchResults.length} found)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchResults.length === 0 ? (
              <p className="text-xs text-ink-muted py-4 text-center">
                No matching journal entries found.
              </p>
            ) : (
              searchResults.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleSelectDate(entry.entryDate)}
                  className="p-3 rounded-lg border border-canvas-borderLight hover:border-canvas-border hover:bg-canvas-subtle/50 cursor-pointer transition-all space-y-1 text-xs"
                >
                  <div className="font-semibold text-ink flex items-center justify-between">
                    <span>{formatDateDisplay(entry.entryDate)}</span>
                    <Badge variant="subtle">Click to inspect</Badge>
                  </div>
                  {entry.gratitude && (
                    <p className="text-ink-muted">
                      <strong>Gratitude:</strong> {entry.gratitude}
                    </p>
                  )}
                  {entry.wentWell && (
                    <p className="text-ink-muted">
                      <strong>Went Well:</strong> {entry.wentWell}
                    </p>
                  )}
                  {entry.challenge && (
                    <p className="text-ink-muted">
                      <strong>Challenge:</strong> {entry.challenge}
                    </p>
                  )}
                  {entry.freeText && (
                    <p className="text-ink-muted">
                      <strong>Notes:</strong> {entry.freeText}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-canvas-border">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-semibold text-ink">
                  {new Date(curYear, curMonth - 1, 1).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] text-ink-subtle">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slateBlue-500 inline-block" />
                  Check-in
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sage-500 inline-block" />
                  Journal
                </span>
              </div>
            </CardHeader>

            <CardContent>
              {/* Day of week headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-[11px] font-semibold text-ink-subtle py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty prefix slots */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 bg-canvas-subtle/20 rounded-lg" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${curYear}-${String(curMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const rec = dayRecordsMap.get(dateStr);
                  const hasCheckin = Boolean(rec?.checkin);
                  const hasJournal = Boolean(
                    rec?.journal &&
                      (rec.journal.gratitude ||
                        rec.journal.wentWell ||
                        rec.journal.challenge ||
                        rec.journal.freeText)
                  );
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleSelectDate(dateStr)}
                      className={cn(
                        "h-20 p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer",
                        isSelected
                          ? "border-ink bg-canvas-subtle ring-1 ring-ink"
                          : "border-canvas-border bg-white hover:border-canvas-borderLight hover:bg-canvas-subtle/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">
                          {dayNum}
                        </span>
                        {hasCheckin && hasJournal && (
                          <span className="text-[10px] text-sage-600 font-bold">✓</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {hasCheckin && rec?.checkin && (
                          <div className="flex items-center gap-1 text-[10px] text-slateBlue-700 font-medium truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-slateBlue-500 shrink-0" />
                            <span>{rec.checkin.sleepHours}h • {rec.checkin.energy}/5</span>
                          </div>
                        )}
                        {hasJournal && (
                          <div className="flex items-center gap-1 text-[10px] text-sage-700 font-medium truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-sage-500 shrink-0" />
                            <span>Reflected</span>
                          </div>
                        )}
                        {!hasCheckin && !hasJournal && (
                          <span className="text-[10px] text-ink-subtle/40 italic">
                            No entry
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Detail Inspector */}
        <div className="space-y-4">
          <Card className="border-canvas-border sticky top-6">
            <CardHeader className="py-4 border-b border-canvas-borderLight">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">
                    {selectedDate
                      ? formatDateDisplay(selectedDate)
                      : "Select a Date to Inspect"}
                  </CardTitle>
                  <CardDescription>
                    Detailed overview of quantitative metrics and journal content.
                  </CardDescription>
                </div>
                {selectedDate && (
                  <Link href={`/journal?date=${selectedDate}`}>
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <span>Edit</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              {!selectedDate ? (
                <div className="py-8 text-center text-xs text-ink-subtle">
                  Click any calendar date on the left to inspect recorded data.
                </div>
              ) : !selectedRecord ||
                (!selectedRecord.checkin && !selectedRecord.journal && !selectedRecord.intention) ? (
                <div className="py-8 text-center text-xs text-ink-subtle space-y-3">
                  <p>No data recorded for {selectedDate}.</p>
                  <Link href={`/journal?date=${selectedDate}`}>
                    <Button size="sm" variant="primary">
                      Create Entry for this Date
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {/* Daily Intention */}
                  {selectedRecord.intention && (
                    <div className="p-3 bg-canvas-cardMuted rounded-lg border border-canvas-borderLight space-y-2">
                      <div className="flex items-center gap-1.5 font-semibold text-ink text-[11px]">
                        <Target className="w-3.5 h-3.5 text-slateBlue-600" />
                        <span>Daily Intentions</span>
                      </div>
                      <div className="text-ink">
                        <span className="text-ink-subtle block text-[10px] uppercase tracking-wider">
                          Learning Priority
                        </span>
                        <p className="mt-0.5">{selectedRecord.intention.learningPriority}</p>
                      </div>
                      <div className="text-ink pt-1">
                        <span className="text-ink-subtle block text-[10px] uppercase tracking-wider">
                          Recovery Action
                        </span>
                        <p className="mt-0.5">{selectedRecord.intention.recoveryAction}</p>
                      </div>
                    </div>
                  )}

                  {/* Quantitative Check-in */}
                  {selectedRecord.checkin ? (
                    <div className="p-3 bg-white rounded-lg border border-canvas-border space-y-2">
                      <div className="flex items-center justify-between font-semibold text-ink text-[11px]">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-slateBlue-500" />
                          Quantitative Check-in
                        </span>
                        <Badge variant="subtle">Recorded</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-ink-muted">
                        <div>
                          Sleep: <strong className="text-ink">{selectedRecord.checkin.sleepHours}h</strong> (Q: {selectedRecord.checkin.sleepQuality}/5)
                        </div>
                        <div>
                          Energy: <strong className="text-ink">{selectedRecord.checkin.energy}/5</strong>
                        </div>
                        <div>
                          Mood: <strong className="text-ink">{selectedRecord.checkin.mood}/5</strong>
                        </div>
                        <div>
                          Focus: <strong className="text-ink">{selectedRecord.checkin.focus}/5</strong>
                        </div>
                        <div>
                          Workload: <strong className="text-ink">{selectedRecord.checkin.workload}/5</strong>
                        </div>
                        <div>
                          Study: <strong className="text-ink">{selectedRecord.checkin.studyMinutes}m</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-canvas-cardMuted rounded-lg text-ink-subtle italic">
                      No check-in metrics recorded.
                    </div>
                  )}

                  {/* Qualitative Journal */}
                  {selectedRecord.journal &&
                  (selectedRecord.journal.gratitude ||
                    selectedRecord.journal.wentWell ||
                    selectedRecord.journal.challenge ||
                    selectedRecord.journal.freeText) ? (
                    <div className="p-3 bg-white rounded-lg border border-canvas-border space-y-3">
                      <div className="flex items-center justify-between font-semibold text-ink text-[11px]">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-sage-600" />
                          Journal Entry
                        </span>
                        <Badge variant="sage">Reflected</Badge>
                      </div>

                      {selectedRecord.journal.gratitude && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-warmAmber-600">
                            Gratitude
                          </span>
                          <p className="text-ink mt-0.5">{selectedRecord.journal.gratitude}</p>
                        </div>
                      )}

                      {selectedRecord.journal.wentWell && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-sage-600">
                            Went Well
                          </span>
                          <p className="text-ink mt-0.5">{selectedRecord.journal.wentWell}</p>
                        </div>
                      )}

                      {selectedRecord.journal.challenge && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slateBlue-600">
                            Challenge
                          </span>
                          <p className="text-ink mt-0.5">{selectedRecord.journal.challenge}</p>
                        </div>
                      )}

                      {selectedRecord.journal.freeText && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-ink-subtle">
                            Free Reflection
                          </span>
                          <p className="text-ink mt-0.5">{selectedRecord.journal.freeText}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-canvas-cardMuted rounded-lg text-ink-subtle italic">
                      No journal reflection recorded.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
