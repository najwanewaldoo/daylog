import React from "react";
import { JournalPageClient } from "@/components/journal/JournalPageClient";
import { getDayRecord } from "@/lib/db/queries";
import { getTodayDateString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const date = searchParams?.date || getTodayDateString();
  const record = await getDayRecord(date);

  return <JournalPageClient initialDate={date} initialRecord={record} />;
}
