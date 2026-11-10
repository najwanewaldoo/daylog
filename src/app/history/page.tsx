import React from "react";
import { HistoryView } from "@/components/history/HistoryView";
import { getTodayDateString } from "@/lib/utils";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  await requireUser();
  const today = getTodayDateString();
  const currentYearMonth = today.slice(0, 7);

  return <HistoryView initialYearMonth={currentYearMonth} />;
}
