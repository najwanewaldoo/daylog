import React from "react";
import { HistoryView } from "@/components/history/HistoryView";
import { getTodayDateString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const today = getTodayDateString();
  const currentYearMonth = today.slice(0, 7);

  return <HistoryView initialYearMonth={currentYearMonth} />;
}
