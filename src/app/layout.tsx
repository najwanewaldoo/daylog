import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Daylog — Personal Learning Analytics & Well-being",
  description:
    "Understand your patterns. Improve your learning. A private, local-first reflection and analytics platform for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
