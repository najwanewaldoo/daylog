"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricTrendChart } from "@/components/analytics/MetricTrendChart";
import { MetricAveragesCard } from "@/components/analytics/MetricAveragesCard";
import { MetricComparison } from "@/components/review/MetricComparison";
import {
  Sparkles,
  Info,
  Calendar,
  Compass,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
} from "lucide-react";
import type { WeeklyReviewResult } from "@/types";

interface WeeklyReviewViewProps {
  reviewData: WeeklyReviewResult;
  onRangeChange?: (start: string, end: string) => void;
}

export function WeeklyReviewView({
  reviewData,
  onRangeChange,
}: WeeklyReviewViewProps) {
  const router = useRouter();
  const [userWeeklyReflection, setUserWeeklyReflection] = useState(
    reviewData.savedReflection || ""
  );
  const [savingReflection, setSavingReflection] = useState(false);
  const [reflectionSavedMessage, setReflectionSavedMessage] = useState<string | null>(null);

  const {
    hasSufficientData,
    startDate,
    endDate,
    analytics,
    insights,
    recommendations,
    journalExcerpts,
    savedReflection,
  } = reviewData;

  useEffect(() => {
    setUserWeeklyReflection(savedReflection || "");
    setReflectionSavedMessage(null);
  }, [savedReflection, startDate, endDate]);

  function navigateWeek(daysOffset: number) {
    const s = new Date(`${startDate}T00:00:00`);
    s.setDate(s.getDate() + daysOffset);
    const e = new Date(`${endDate}T00:00:00`);
    e.setDate(e.getDate() + daysOffset);

    const fmt = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    router.push(`/review?start=${fmt(s)}&end=${fmt(e)}`);
  }

  function setRollingPast7Days() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);

    const fmt = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    router.push(`/review?start=${fmt(start)}&end=${fmt(end)}`);
  }

  async function handleSaveReflection() {
    if (!userWeeklyReflection.trim()) return;
    setSavingReflection(true);
    setReflectionSavedMessage(null);

    try {
      const res = await fetch("/api/review/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          reflection: userWeeklyReflection.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save weekly reflection");
      }

      setReflectionSavedMessage("Weekly reflection saved to database.");
    } catch (err: unknown) {
      console.error("Save error:", err);
      setReflectionSavedMessage("Failed to save reflection.");
    } finally {
      setSavingReflection(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header and Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-canvas-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sage-100 text-sage-700">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Weekly Review
            </h1>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Synthesizing daily habits, energy patterns, and personal reflections.
          </p>
        </div>

        {/* Range Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigateWeek(-7)}
            aria-label="Previous week"
            className="text-xs px-2"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" />
            <span>Prev Week</span>
          </Button>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-canvas-border shadow-xs text-xs font-semibold text-ink">
            <Calendar className="w-3.5 h-3.5 text-ink-subtle" />
            <span>
              {startDate} <span className="text-ink-subtle font-normal">to</span> {endDate}
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigateWeek(7)}
            aria-label="Next week"
            className="text-xs px-2"
          >
            <span>Next Week</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={setRollingPast7Days}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="w-3 h-3 text-ink-muted" />
            <span>Past 7 Days</span>
          </Button>
        </div>
      </div>

      {/* Insufficient Data State */}
      {!hasSufficientData ? (
        <Card className="border-canvas-border bg-white">
          <CardContent className="py-12 px-6 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-canvas-subtle flex items-center justify-center mx-auto mb-4 text-ink-subtle">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-ink mb-2">
              Insufficient Data for Meaningful Review
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed mb-6">
              Keep recording your daily check-ins and reflections. Daylog needs more information before it can identify meaningful patterns.
            </p>
            <div className="p-3 bg-canvas-cardMuted rounded-lg border border-canvas-borderLight text-[11px] text-ink-subtle text-left space-y-1">
              <div className="font-medium text-ink">Requirement:</div>
              <div>• At least 3 daily check-in records in this 7-day period.</div>
              <div>• Currently recorded: {analytics?.totalDaysRecorded ?? 0} / 7 days.</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Section 1: Weekly Numerical Overview */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slateBlue-500" />
                1. Numerical Summary ({analytics?.totalDaysRecorded} days recorded)
              </h2>
            </div>
            {analytics && (
              <MetricAveragesCard
                averages={analytics.averages}
                totalDays={analytics.totalDaysRecorded}
                totalStudyHours={analytics.totalStudyHours}
              />
            )}
          </section>

          {/* Section 2: Trends in Sleep, Energy, Mood, and Focus */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-ink tracking-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sage-600" />
              2. Patterns & Metric Trends
            </h2>
            {analytics && <MetricTrendChart data={analytics.dailyMetrics} />}
          </section>

          {/* Section 3: Comparison between selected metrics */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-ink tracking-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ink" />
              3. Comparison Between Selected Metrics
            </h2>
            {analytics && <MetricComparison dailyMetrics={analytics.dailyMetrics} />}
          </section>

          {/* Section 4: Contextual Observations (Bridging Quantitative & Qualitative) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warmAmber-500" />
                4. Contextual Observations & Journal Integration
              </h2>
              <Badge variant="subtle">Rule-based • Explainable</Badge>
            </div>

            {insights.length === 0 ? (
              <Card className="border-canvas-border">
                <CardContent className="py-6 text-center text-xs text-ink-muted">
                  No distinct pattern anomalies observed this week. Your recorded metrics remained steady.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight) => (
                  <Card key={insight.id} className="border-canvas-border flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold text-ink">
                          {insight.title}
                        </CardTitle>
                        <Badge variant="sage">Observed Pattern</Badge>
                      </div>
                      <p className="text-xs text-ink mt-2 leading-relaxed">
                        {insight.observation}
                      </p>
                    </CardHeader>

                    {insight.journalContext && (
                      <div className="px-5 pb-4 pt-0">
                        <div className="p-3 bg-canvas-cardMuted rounded-lg border border-canvas-borderLight">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-ink-muted mb-1">
                            <FileText className="w-3.5 h-3.5 text-sage-600" />
                            <span>Qualitative Context</span>
                          </div>
                          <p className="text-xs italic text-ink-muted leading-relaxed">
                            {insight.journalContext}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Section 5: Relevant Journal Excerpts From Period */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-ink tracking-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ink-subtle" />
              5. Key Journal Excerpts from this Week
            </h2>

            {journalExcerpts.length === 0 ? (
              <Card className="border-canvas-border">
                <CardContent className="py-6 text-center text-xs text-ink-muted">
                  No written reflections were recorded during this week.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {journalExcerpts.map((excerpt, idx) => (
                  <Card key={idx} className="border-canvas-border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-ink-subtle">
                        <span>{excerpt.date}</span>
                        <Badge variant="subtle" className="capitalize text-[10px]">
                          {excerpt.type === "wentWell"
                            ? "Went Well"
                            : excerpt.type === "freeText"
                            ? "Reflection"
                            : excerpt.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink leading-relaxed">
                        &ldquo;{excerpt.content}&rdquo;
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Section 6: Simple Personal Recommendations */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sage-500" />
                6. Actionable Recommendations
              </h2>
              <span className="text-[11px] text-ink-subtle">Optional • Non-diagnostic</span>
            </div>

            {recommendations.length === 0 ? (
              <Card className="border-canvas-border">
                <CardContent className="py-6 text-center text-xs text-ink-muted">
                  Your baseline across sleep, energy, and workload stayed well-balanced this week. Keep maintaining this sustainable rhythm.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <Card key={rec.id} className="border-canvas-border border-l-4 border-l-sage-500">
                    <CardContent className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-ink">
                          {rec.title}
                        </h4>
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {rec.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink leading-relaxed">
                        {rec.description}
                      </p>
                      <p className="text-[11px] text-ink-subtle italic pt-1">
                        {rec.triggerExplanation}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Section 7: Weekly Synthesis & Reflection */}
          <section className="space-y-3">
            <Card className="border-canvas-border">
              <CardHeader>
                <CardTitle>7. Weekly Reflection</CardTitle>
                <CardDescription>
                  Synthesize what you learned about your study rhythm this week. What will you preserve or adjust for next week?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  rows={4}
                  value={userWeeklyReflection}
                  onChange={(e) => {
                    setUserWeeklyReflection(e.target.value);
                    setReflectionSavedMessage(null);
                  }}
                  placeholder="e.g. My focus is visibly tied to 7+ hours of sleep. On Wednesday my assignments piled up, so next week I will tackle the problem sets on Monday and Tuesday..."
                  className="w-full px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-ink"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-sage-600">
                    {reflectionSavedMessage ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {reflectionSavedMessage}
                      </span>
                    ) : (
                      ""
                    )}
                  </span>
                  <Button
                    size="sm"
                    disabled={savingReflection}
                    onClick={handleSaveReflection}
                  >
                    {savingReflection ? "Saving..." : "Save Reflection"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Privacy & Medical Disclaimer */}
          <div className="p-4 rounded-xl bg-canvas-cardMuted border border-canvas-borderLight text-xs text-ink-subtle leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-ink-subtle" />
            <p>
              <strong>Notice:</strong> Daylog is an educational reflection and self-awareness tool. Numerical trends and rule-based observations are intended for personal learning optimization and are not medical, psychological, or clinical diagnoses.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
