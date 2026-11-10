import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "sage" | "amber" | "outline" | "subtle";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const styles = {
    default: "bg-ink text-white",
    sage: "bg-sage-100 text-sage-700 border border-sage-200",
    amber: "bg-warmAmber-100 text-warmAmber-600 border border-warmAmber-500/20",
    outline: "bg-transparent border border-canvas-border text-ink-muted",
    subtle: "bg-canvas-subtle text-ink-muted border border-canvas-borderLight",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-tight",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
