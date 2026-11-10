import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  validateSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from "./session";
import type { User } from "../db/schema";

export { setSessionCookie, clearSessionCookie, SESSION_COOKIE_NAME };

/**
 * Retrieves the currently authenticated user from the session cookie,
 * validating the token against the database and checking its expiry.
 * Returns null if unauthenticated or expired. Never throws or redirects.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    const result = await validateSessionToken(token);
    return result?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Ensures a user is authenticated.
 * - Server Components / Pages: redirects to /login if unauthenticated.
 * - API Routes (or requests to /api/*): returns a JSON 401 NextResponse if unauthenticated.
 */
export async function requireUser(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    let isApi = false;
    try {
      const h = headers();
      const pathname = h.get("x-pathname") || "";
      const accept = h.get("accept") || "";
      if (
        pathname.startsWith("/api/") ||
        accept.includes("application/json") ||
        !accept.includes("text/html")
      ) {
        isApi = true;
      }
    } catch {
      // In environment without headers (e.g. some tests), default to API response
      isApi = true;
    }

    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    redirect("/login");
  }
  return user;
}

/**
 * Validates that the request origin matches the host header
 * for state-changing (POST, PUT, DELETE, PATCH) API requests.
 */
export function validateSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "Forbidden: cross-origin request rejected" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Forbidden: invalid origin header" },
        { status: 403 }
      );
    }
  }

  return null;
}
