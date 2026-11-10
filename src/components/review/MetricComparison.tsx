"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, SlidersHorizontal, Scale } from "lucide-react";

interface MetricOption {
  key: "sleepHours" | "sleepQuality" | "energy" | "mood" | "focus" | "workload" | "studyMinutes";
  label: string;
  unit: string;
  domain: [number, number];
  color: string;
}

const METRIC_OPTIONS: MetricOption[] = [
  { key: "sleepHours", label: "Sleep Duration", unit: "h", domain: [0, 14], color: "#395873" },
  { key: "sleepQuality", label: "Sleep Quality", unit: "/5", domain: [1, 5], color: "#5A7D7C" },
  { key: "energy", label: "Energy Level", unit: "/5", domain: [1, 5], color: "#B87528" },
  { key: "mood", label: "Mood", unit: "/5", domain: [1, 5], color: "#4F766C" },
  { key: "focus", label: "Focus & Attention", unit: "/5", domain: [1, 5], color: "#18202A" },
  { key: "workload", label: "Academic Workload", unit: "/5", domain: [1, 5], color: "#995C1B" },
  { key: "studyMinutes", label: "Study Duration", unit: "min", domain: [0, 360], color: "#2B4358" },
];

interface MetricComparisonProps {
  dailyMetrics: Array<{
    date: string;
    dayOfWeek: string;
    sleepHours: number | null;
    sleepQuality: number | null;
    energy: number | null;
    mood: number | null;
    focus: number | null;
    workload: number | null;
    studyMinutes: number | null;
    hasJournal: boolean;
  }>;
}

export function MetricComparison({ dailyMetrics }: MetricComparisonProps) {
  const [metric1Key, setMetric1Key] = useState<MetricOption["key"]>("sleepHours");
  const [metric2Key, setMetric2Key] = useState<MetricOption["key"]>("focus");

  const metric1 = METRIC_OPTIONS.find((m) => m.key === metric1Key)!;
  const metric2 = METRIC_OPTIONS.find((m) => m.key === metric2Key)!;

  const validDays = dailyMetrics.filter(
    (d) => d[metric1Key] !== null && d[metric2Key] !== null
  );

  const comparisonStats = useMemo(() => {
    if (validDays.length < 2) return null;

    const values1 = validDays.map((d) => d[metric1Key] as number);
    const avg1 = values1.reduce((a, b) => a + b, 0) / values1.length;

    const aboveGroup = validDays.filter((d) => (d[metric1Key] as number) >= avg1);
    const belowGroup = validDays.filter((d) => (d[metric1Key] as number) < avg1);

    if (aboveGroup.length === 0 || belowGroup.length === 0) return null;

    const avg2Above =
      aboveGroup.reduce((sum, d) => sum + (d[metric2Key] as number), 0) /
      aboveGroup.length;
    const avg2Below =
      belowGroup.reduce((sum, d) => sum + (d[metric2Key] as number), 0) /
      belowGroup.length;

    const diff = Math.round((avg2Above - avg2Below) * 10) / 10;

    let observationText = "";
    if (Math.abs(diff) < 0.2) {
      observationText = `Your ${metric2.label.toLowerCase()} remained largely similar regardless of whether ${metric1.label.toLowerCase()} was above or below your weekly average.`;
    } else if (diff > 0) {
      observationText = `Your ${metric2.label.toLowerCase()} tended to be higher on days when ${metric1.label.toLowerCase()} was at or above your weekly average (${avg2Above.toFixed(
        1
      )}${metric2.unit} vs ${avg2Below.toFixed(1)}${metric2.unit}).`;
    } else {
      observationText = `Your ${metric2.label.toLowerCase()} tended to be lower on days when ${metric1.label.toLowerCase()} was at or above your weekly average (${avg2Above.toFixed(
        1
      )}${metric2.unit} vs ${avg2Below.toFixed(1)}${metric2.unit}).`;
    }

    return {
      avg1: Math.round(avg1 * 10) / 10,
      aboveCount: aboveGroup.length,
      belowCount: belowGroup.length,
      avg2Above: Math.round(avg2Above * 10) / 10,
      avg2Below: Math.round(avg2Below * 10) / 10,
      observationText,
    };
  }, [validDays, metric1Key, metric2Key, metric1, metric2]);

  const chartData = dailyMetrics.map((d) => ({
    label: `${d.dayOfWeek} (${d.date.slice(5)})`,
    date: d.date,
    [metric1.label]: d[metric1Key],
    [metric2.label]: d[metric2Key],
  }));

  return (
    <Card className="border-canvas-border">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-canvas-subtle text-ink">
              <Scale className="w-4 h-4" />
            </span>
            <div>
              <CardTitle className="text-sm">Metric Comparison & Cross-Analysis</CardTitle>
              <CardDescription>
                Select two tracking variables to observe how they co-occurred this week.
              </CardDescription>
            </div>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-canvas-subtle p-1 rounded-lg border border-canvas-borderLight">
              <span className="text-[11px] font-semibold text-ink-subtle pl-1.5">Metric 1:</span>
              <select
                value={metric1Key}
                onChange={(e) => setMetric1Key(e.target.value as MetricOption["key"])}
                className="bg-white border border-canvas-border rounded px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                {METRIC_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key} disabled={opt.key === metric2Key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-ink-subtle text-xs">vs</span>

            <div className="flex items-center gap-1.5 bg-canvas-subtle p-1 rounded-lg border border-canvas-borderLight">
              <span className="text-[11px] font-semibold text-ink-subtle pl-1.5">Metric 2:</span>
              <select
                value={metric2Key}
                onChange={(e) => setMetric2Key(e.target.value as MetricOption["key"])}
                className="bg-white border border-canvas-border rounded px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                {METRIC_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key} disabled={opt.key === metric1Key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Descriptive Observation Banner */}
        {comparisonStats && (
          <div className="p-3 bg-canvas-cardMuted rounded-xl border border-canvas-borderLight text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-ink font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
              <span>Observed Relationship (Non-Causal)</span>
            </div>
            <p className="text-ink leading-relaxed">
              {comparisonStats.observationText}
            </p>
            <p className="text-[10px] text-ink-subtle italic">
              Weekly average for {metric1.label}: {comparisonStats.avg1}{metric1.unit} (tested across {comparisonStats.aboveCount} higher days vs {comparisonStats.belowCount} lower days).
            </p>
          </div>
        )}

        {/* Dual Axis Comparison Chart */}
        <div className="h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7E8B9B" }} />
              <YAxis
                yAxisId="left"
                domain={metric1.domain}
                tick={{ fontSize: 11, fill: "#7E8B9B" }}
                unit={metric1.unit !== "/5" ? metric1.unit : ""}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={metric2.domain}
                tick={{ fontSize: 11, fill: "#7E8B9B" }}
                unit={metric2.unit !== "/5" ? metric2.unit : ""}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E7E5DF",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar
                yAxisId="left"
                dataKey={metric1.label}
                fill={metric1.color}
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={metric2.label}
                stroke={metric2.color}
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Day-by-Day Comparative Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-canvas-border text-[11px] text-ink-subtle font-semibold">
                <th className="py-2 pr-3">Day</th>
                <th className="py-2 px-3">{metric1.label}</th>
                <th className="py-2 px-3">{metric2.label}</th>
                <th className="py-2 pl-3">Day Comparison</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-borderLight">
              {dailyMetrics.map((d) => {
                const val1 = d[metric1Key];
                const val2 = d[metric2Key];
                const hasBoth = val1 !== null && val2 !== null;

                return (
                  <tr key={d.date} className="hover:bg-canvas-subtle/30">
                    <td className="py-2 pr-3 font-medium text-ink">
                      {d.dayOfWeek} ({d.date.slice(5)})
                    </td>
                    <td className="py-2 px-3 text-ink">
                      {val1 !== null ? `${val1} ${metric1.unit}` : "—"}
                    </td>
                    <td className="py-2 px-3 text-ink">
                      {val2 !== null ? `${val2} ${metric2.unit}` : "—"}
                    </td>
                    <td className="py-2 pl-3 text-ink-subtle">
                      {hasBoth && comparisonStats ? (
                        (val1 as number) >= comparisonStats.avg1 ? (
                          <span className="text-sage-700 font-medium">Above avg {metric1.label.toLowerCase()}</span>
                        ) : (
                          <span className="text-warmAmber-600 font-medium">Below avg {metric1.label.toLowerCase()}</span>
                        )
                      ) : (
                        "No data"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
