import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  deleteSession,
  clearSessionCookie,
} from "@/lib/auth/session";
import { validateSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const originError = validateSameOrigin(request);
    if (originError) return originError;

    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await deleteSession(token);
    }

    clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    clearSessionCookie();
    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });
  }
}
