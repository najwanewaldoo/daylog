"use client";

import React, { useState, useEffect } from "react";
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
  LogOut,
  User as UserIcon,
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
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (isAuthPage) return;
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, [pathname, isAuthPage]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  // Auth pages render without sidebar, top header, drawer, or bottom nav
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex flex-col justify-center">
        {children}
      </div>
    );
  }

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
        <div className="md:hidden fixed inset-0 top-[53px] bg-white z-50 p-4 border-b border-canvas-border flex flex-col justify-between">
          <div className="space-y-1">
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

          {/* Mobile User & Logout */}
          <div className="pt-4 border-t border-canvas-borderLight space-y-3 pb-2">
            {userEmail && (
              <div className="px-2">
                <span className="text-[10px] uppercase font-semibold text-ink-subtle">
                  Signed in as
                </span>
                <p className="text-xs font-medium text-ink truncate" title={userEmail}>
                  {userEmail}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
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

        {/* User Account & Logout & Privacy */}
        <div className="space-y-3">
          {/* User Email & Logout */}
          <div className="p-3 bg-canvas-subtle rounded-xl border border-canvas-border space-y-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-ink/10 flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-ink" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">
                  Account
                </p>
                <p
                  className="text-xs font-medium text-ink truncate"
                  title={userEmail || "Signed in"}
                >
                  {userEmail || "Signed in"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer border border-transparent hover:border-red-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>

          {/* Calm Privacy Banner */}
          <div className="p-3 bg-canvas-cardMuted rounded-xl border border-canvas-borderLight">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <span className="w-2 h-2 rounded-full bg-sage-500 inline-block" />
              <span>Private & Scoped</span>
            </div>
            <p className="text-[11px] text-ink-subtle mt-1 leading-normal">
              Your journals and analytics are private to your account.
            </p>
          </div>
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
