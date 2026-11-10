import React from "react";
import { JournalPageClient } from "@/components/journal/JournalPageClient";
import { getDayRecord } from "@/lib/db/queries";
import { getTodayDateString } from "@/lib/utils";
import { requireUser } from "@/lib/auth";
import type { User } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const user = (await requireUser()) as User;
  const date = searchParams?.date || getTodayDateString();
  const record = await getDayRecord(user.id, date);

  return <JournalPageClient initialDate={date} initialRecord={record} />;
}
