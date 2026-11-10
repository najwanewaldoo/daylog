import { NextRequest, NextResponse } from "next/server";
import { searchJournals } from "@/lib/db/queries";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof Response) return auth;
    const user = auth;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const results = await searchJournals(user.id, query);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Error searching journals:", error);
    return NextResponse.json(
      { error: "Failed to search journals." },
      { status: 500 }
    );
  }
}
