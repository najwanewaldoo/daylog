"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Sparkles,
  Settings,
  Menu,
  X,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Daily Journal", icon: BookOpen },
  { href: "/history", label: "History", icon: CalendarDays },
  { href: "/review", label: "Weekly Review", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-canvas text-ink">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-canvas-border sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center text-white">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-ink leading-tight">
              Daylog
            </h1>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-md hover:bg-canvas-subtle text-ink-muted focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] bg-white z-50 p-4 border-b border-canvas-border space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-canvas-subtle text-ink font-semibold"
                    : "text-ink-muted hover:bg-canvas-subtle/60 hover:text-ink"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-ink" : "text-ink-subtle"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-canvas-border bg-white px-5 py-6 shrink-0 h-screen sticky top-0 justify-between">
        <div className="space-y-6">
          {/* Logo & Tagline */}
          <Link href="/" className="block group">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-white shadow-sm">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-ink">
                Daylog
              </span>
            </div>
            <p className="text-[11px] text-ink-subtle mt-1.5 leading-relaxed font-normal">
              Understand your patterns. <br />
              Improve your learning.
            </p>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1 pt-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-canvas-subtle text-ink font-semibold shadow-xs"
                      : "text-ink-muted hover:bg-canvas-subtle/50 hover:text-ink"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-ink" : "text-ink-subtle"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Calm Privacy Banner */}
        <div className="p-3 bg-canvas-cardMuted rounded-xl border border-canvas-borderLight">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
            <span className="w-2 h-2 rounded-full bg-sage-500 inline-block" />
            <span>Local & Private</span>
          </div>
          <p className="text-[11px] text-ink-subtle mt-1 leading-normal">
            Your data stays in this browser and local SQLite database. No external tracking.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-16 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-canvas-border z-40 flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded text-[10px] font-medium transition-colors",
                isActive ? "text-ink font-bold" : "text-ink-subtle hover:text-ink"
              )}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
