"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Moon, Zap, Smile, Compass, Clock, BookOpen } from "lucide-react";

interface MetricAveragesProps {
  averages: {
    sleepHours: number;
    sleepQuality: number;
    energy: number;
    mood: number;
    focus: number;
    workload: number;
    studyMinutes: number;
  };
  totalDays: number;
  totalStudyHours?: number;
}

export function MetricAveragesCard({
  averages,
  totalDays,
  totalStudyHours,
}: MetricAveragesProps) {
  const cards = [
    {
      label: "Avg Sleep",
      value: totalDays > 0 ? `${averages.sleepHours}h` : "—",
      sub: totalDays > 0 ? `Quality: ${averages.sleepQuality}/5` : "No data",
      icon: Moon,
      color: "text-slateBlue-500",
    },
    {
      label: "Avg Energy",
      value: totalDays > 0 ? `${averages.energy} / 5` : "—",
      sub: "Daily vitality",
      icon: Zap,
      color: "text-warmAmber-600",
    },
    {
      label: "Avg Mood",
      value: totalDays > 0 ? `${averages.mood} / 5` : "—",
      sub: "Emotional outlook",
      icon: Smile,
      color: "text-sage-600",
    },
    {
      label: "Avg Focus",
      value: totalDays > 0 ? `${averages.focus} / 5` : "—",
      sub: "Concentration",
      icon: Compass,
      color: "text-ink",
    },
    {
      label: "Avg Study",
      value:
        totalDays > 0
          ? `${Math.round(averages.studyMinutes)} min`
          : "—",
      sub:
        totalStudyHours !== undefined && totalDays > 0
          ? `${totalStudyHours}h total this week`
          : "Daily independent",
      icon: Clock,
      color: "text-sage-700",
    },
    {
      label: "Avg Workload",
      value: totalDays > 0 ? `${averages.workload} / 5` : "—",
      sub: "Academic intensity",
      icon: BookOpen,
      color: "text-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} className="border-canvas-border hover:border-canvas-borderLight transition-colors">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-ink-muted">{item.label}</span>
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
              <div className="text-lg font-bold text-ink tracking-tight">
                {item.value}
              </div>
              <div className="text-[10px] text-ink-subtle mt-0.5 truncate">
                {item.sub}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
