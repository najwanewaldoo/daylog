"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, AlertCircle, ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      window.location.href = "/";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-ink text-white shadow-sm mb-2">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Welcome back to Daylog
        </h1>
        <p className="text-xs text-ink-muted">
          Sign in to access your private journal, metrics, and weekly reviews.
        </p>
      </div>

      <Card className="border-canvas-border shadow-sm">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-ink"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-ink"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-canvas-border rounded-lg bg-white text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition"
              />
            </div>

            <Button
              type="submit"
              className="w-full justify-center mt-2"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <span className="flex items-center gap-1.5">
                  Sign In <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-canvas-borderLight text-center">
            <p className="text-xs text-ink-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-ink hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
