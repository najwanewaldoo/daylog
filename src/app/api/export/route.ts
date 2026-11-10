import { NextRequest, NextResponse } from "next/server";
import { exportAllData } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const data = await exportAllData();

    if (format === "csv") {
      // Export check-ins and journals as CSV
      const headers = [
        "date",
        "sleep_hours",
        "sleep_quality",
        "energy",
        "mood",
        "focus",
        "workload",
        "study_minutes",
        "gratitude",
        "went_well",
        "challenge",
        "free_text",
      ];

      const journalMap = new Map(
        data.journalEntries.map((j) => [j.entryDate, j])
      );

      const rows: string[] = [headers.join(",")];

      for (const c of data.dailyCheckins) {
        const j = journalMap.get(c.entryDate);
        const escape = (val: string | null | undefined) =>
          val ? `"${val.replace(/"/g, '""').replace(/\n/g, " ")}"` : '""';

        const row = [
          c.entryDate,
          c.sleepHours,
          c.sleepQuality,
          c.energy,
          c.mood,
          c.focus,
          c.workload,
          c.studyMinutes,
          escape(j?.gratitude),
          escape(j?.wentWell),
          escape(j?.challenge),
          escape(j?.freeText),
        ];
        rows.push(row.join(","));
      }

      const csvContent = rows.join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="daylog-export-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    }

    // Default JSON export
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="daylog-export-${
          new Date().toISOString().split("T")[0]
        }.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data." },
      { status: 500 }
    );
  }
}
