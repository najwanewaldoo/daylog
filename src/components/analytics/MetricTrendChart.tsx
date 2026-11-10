"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MetricTrendProps {
  data: Array<{
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
  title?: string;
  description?: string;
}

export function MetricTrendChart({
  data,
  title = "Metric Trends",
  description = "Observe your daily variations across the selected week.",
}: MetricTrendProps) {
  const [activeTab, setActiveTab] = useState<"states" | "sleep" | "study">("states");

  const formattedData = data.map((d) => ({
    ...d,
    label: `${d.dayOfWeek} (${d.date.slice(5)})`,
  }));

  const hasAnyData = data.some(
    (d) =>
      d.energy !== null ||
      d.sleepHours !== null ||
      d.studyMinutes !== null
  );

  return (
    <Card className="border-canvas-border">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>

          <div className="flex items-center gap-1 bg-canvas-subtle p-1 rounded-lg border border-canvas-border">
            <button
              type="button"
              onClick={() => setActiveTab("states")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                activeTab === "states"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              Energy & Focus
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sleep")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                activeTab === "sleep"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              Sleep
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("study")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                activeTab === "study"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              Study & Workload
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!hasAnyData ? (
          <div className="py-12 text-center text-ink-subtle text-xs">
            No check-in metrics recorded for this date range yet.
          </div>
        ) : (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "states" ? (
                <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7E8B9B" }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#7E8B9B" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E7E5DF",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Energy (1–5)"
                    stroke="#B87528"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    name="Mood (1–5)"
                    stroke="#4F766C"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="focus"
                    name="Focus (1–5)"
                    stroke="#18202A"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              ) : activeTab === "sleep" ? (
                <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7E8B9B" }} />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: "#7E8B9B" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E7E5DF",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Line
                    type="monotone"
                    dataKey="sleepHours"
                    name="Sleep Duration (Hours)"
                    stroke="#395873"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="sleepQuality"
                    name="Sleep Quality (1–5)"
                    stroke="#A3BEB6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              ) : (
                <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7E8B9B" }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#7E8B9B" }} unit="m" />
                  <YAxis yAxisId="right" orientation="right" domain={[1, 5]} tick={{ fontSize: 11, fill: "#7E8B9B" }} />
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
                    dataKey="studyMinutes"
                    name="Study Duration (min)"
                    fill="#4F766C"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="workload"
                    name="Workload (1–5)"
                    stroke="#B87528"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
