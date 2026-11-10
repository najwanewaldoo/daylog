import React from "react";
import { SettingsView } from "@/components/settings/SettingsView";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireUser();
  return <SettingsView />;
}
