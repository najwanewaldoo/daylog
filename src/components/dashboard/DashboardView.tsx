"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricTrendChart } from "@/components/analytics/MetricTrendChart";
import { MetricAveragesCard } from "@/components/analytics/MetricAveragesCard";
import {
  Sun,
  Moon,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Coffee,
  BookOpen,
  ArrowRight,
  Sparkles,
  Calendar,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";
import type { DayRecord } from "@/types";

interface DashboardViewProps {
  data: {
    greeting: string;
    date: string;
    status: {
      hasCheckin: boolean;
      hasJournal: boolean;
    };
    todayRecord: DayRecord;
    tomorrowIntention?: any;
    recentMetrics: any[];
    weekOverview: {
      startDate: string;
      endDate: string;
      recordedDays: number;
      totalStudyHours: number;
      averages: any;
      dailyMetrics: any[];
    };
  };
}

export function DashboardView({ data }: DashboardViewProps) {
  const { greeting, date, status, todayRecord, tomorrowIntention, weekOverview } = data;

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-2 border-b border-canvas-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            {formatDateDisplay(date)}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-0.5">
            {greeting}.
          </h1>
        </div>
        <p className="text-xs text-ink-muted">
          Your calm space for learning habits and reflection.
        </p>
      </div>

      {/* Today's Pulse & Quick Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status: Daily Check-in */}
        <Card className="border-canvas-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-ink-muted">Today&apos;s Check-in</span>
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                {status.hasCheckin ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-sage-600" />
                    <span className="text-ink">Completed</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-warmAmber-600" />
                    <span className="text-ink">Not recorded yet</span>
                  </>
                )}
              </div>
            </div>
            <Link href="/journal">
              <Button size="sm" variant={status.hasCheckin ? "outline" : "primary"}>
                {status.hasCheckin ? "Edit" : "Record"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Status: Journal Reflection */}
        <Card className="border-canvas-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-ink-muted">Today&apos;s Journal</span>
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                {status.hasJournal ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-sage-600" />
                    <span className="text-ink">Reflected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-warmAmber-600" />
                    <span className="text-ink">Awaiting notes</span>
                  </>
                )}
              </div>
            </div>
            <Link href="/journal">
              <Button size="sm" variant={status.hasJournal ? "outline" : "primary"}>
                {status.hasJournal ? "Edit" : "Write"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Weekly Review Shortcut */}
        <Card className="border-canvas-border bg-canvas-cardMuted">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-ink-muted">Weekly Synthesis</span>
              <div className="font-semibold text-sm text-ink">
                {weekOverview.recordedDays >= 3
                  ? `${weekOverview.recordedDays} days logged`
                  : "Need 3+ days"}
              </div>
            </div>
            <Link href="/review">
              <Button size="sm" variant="outline" className="gap-1">
                <span>Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's Active Intentions */}
      <Card className="border-canvas-border">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Today&apos;s Active Intentions</CardTitle>
            <Link href="/journal" className="text-xs text-ink-muted hover:text-ink">
              Edit Intentions →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-canvas-subtle/50 border border-canvas-borderLight space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slateBlue-700">
              <Target className="w-3.5 h-3.5" />
              <span>Current Learning Priority</span>
            </div>
            <p className="text-xs text-ink leading-relaxed">
              {todayRecord.intention?.learningPriority || (
                <span className="text-ink-subtle italic">
                  No learning priority set yet. Set one in your Daily Journal.
                </span>
              )}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-canvas-subtle/50 border border-canvas-borderLight space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sage-700">
              <Coffee className="w-3.5 h-3.5" />
              <span>Today&apos;s Recovery Action</span>
            </div>
            <p className="text-xs text-ink leading-relaxed">
              {todayRecord.intention?.recoveryAction || (
                <span className="text-ink-subtle italic">
                  No recovery action chosen yet. Dedicate time for a restful practice today.
                </span>
              )}
            </p>
          </div>
        </CardContent>

        {tomorrowIntention && (
          <div className="px-5 py-3 border-t border-canvas-borderLight bg-canvas-subtle/30 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="subtle" className="text-[10px]">Tomorrow</Badge>
              <span className="text-ink font-medium">
                Goal: <span className="font-normal text-ink-muted">{tomorrowIntention.learningPriority}</span>
              </span>
              <span className="hidden sm:inline text-ink-subtle">•</span>
              <span className="text-ink font-medium">
                Rest: <span className="font-normal text-ink-muted">{tomorrowIntention.recoveryAction}</span>
              </span>
            </div>
            <Link href="/journal" className="text-[11px] text-ink-muted hover:text-ink shrink-0 font-medium">
              Update Tomorrow&apos;s Plan →
            </Link>
          </div>
        )}
      </Card>

      {/* Short Weekly Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">This Week at a Glance</h2>
            <p className="text-xs text-ink-muted">
              {weekOverview.startDate} to {weekOverview.endDate} • {weekOverview.recordedDays} of 7 days recorded
            </p>
          </div>
          <Link href="/review">
            <Button size="sm" variant="ghost" className="text-xs gap-1">
              <span>Full Weekly Review</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        <MetricAveragesCard
          averages={weekOverview.averages}
          totalDays={weekOverview.recordedDays}
          totalStudyHours={weekOverview.totalStudyHours}
        />

        <MetricTrendChart
          data={weekOverview.dailyMetrics}
          title="Daily Metric Movements"
          description="Track how sleep, study volume, and focus fluctuate together."
        />
      </div>

      {/* Quick Action Bar */}
      <Card className="border-canvas-border bg-gradient-to-r from-canvas-subtle to-white">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-ink">
              Reflect on Today&apos;s Experience
            </h3>
            <p className="text-xs text-ink-muted">
              Capture gratitude, what went well, challenges, and your learning takeaways.
            </p>
          </div>
          <Link href="/journal">
            <Button className="shrink-0 gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Open Daily Journal</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
