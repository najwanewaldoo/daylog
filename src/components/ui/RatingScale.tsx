import React from "react";
import { cn, RATING_LABELS, WORKLOAD_LABELS } from "@/lib/utils";

interface RatingScaleProps {
  label: string;
  description?: string;
  value: number;
  onChange: (val: number) => void;
  variant?: "standard" | "workload";
  disabled?: boolean;
}

export function RatingScale({
  label,
  description,
  value,
  onChange,
  variant = "standard",
  disabled = false,
}: RatingScaleProps) {
  const labels = variant === "workload" ? WORKLOAD_LABELS : RATING_LABELS;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-ink">{label}</label>
          {description && (
            <p className="text-xs text-ink-muted">{description}</p>
          )}
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-canvas-subtle text-ink-muted border border-canvas-border">
          {value ? `${value} — ${labels[value]}` : "Select rating"}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5].map((level) => {
          const isSelected = value === level;
          return (
            <button
              key={level}
              type="button"
              disabled={disabled}
              onClick={() => onChange(level)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs transition-all cursor-pointer",
                isSelected
                  ? "bg-ink text-white border-ink shadow-sm"
                  : "bg-white border-canvas-border text-ink hover:bg-canvas-subtle hover:border-canvas-border"
              )}
            >
              <span className="text-sm font-semibold">{level}</span>
              <span
                className={cn(
                  "text-[10px] truncate max-w-full hidden sm:inline-block",
                  isSelected ? "text-slate-200" : "text-ink-subtle"
                )}
              >
                {labels[level]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
