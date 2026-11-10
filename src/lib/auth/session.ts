import crypto from "node:crypto";
import { cookies } from "next/headers";
import { eq, lte } from "drizzle-orm";
import { getDb } from "../db";
import { users, sessions, type User, type Session } from "../db/schema";

export const SESSION_COOKIE_NAME = "daylog_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: number
): Promise<{ token: string; expiresAt: string }> {
  const db = await getDb();
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  ).toISOString();
  const now = new Date().toISOString();

  // Opportunistic cleanup of expired sessions
  deleteExpiredSessions().catch(() => {});

  await db.insert(sessions).values({
    id: tokenHash,
    userId,
    expiresAt,
    createdAt: now,
  });

  return { token: rawToken, expiresAt };
}

export async function validateSessionToken(
  token: string
): Promise<{ session: Session; user: User } | null> {
  const db = await getDb();
  const tokenHash = hashSessionToken(token);

  const rows = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, tokenHash))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const { session, user } = rows[0];

  // Check expiration
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, tokenHash));
    return null;
  }

  return { session, user };
}

export async function deleteSession(token: string): Promise<void> {
  const db = await getDb();
  const tokenHash = hashSessionToken(token);
  await db.delete(sessions).where(eq(sessions.id, tokenHash));
}

export async function deleteExpiredSessions(): Promise<void> {
  try {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.delete(sessions).where(lte(sessions.expiresAt, now));
  } catch {
    // Ignore opportunistic cleanup errors
  }
}

export function setSessionCookie(token: string): void {
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

// User repository helpers
export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  return rows[0];
}

export async function findUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

export async function createUser(
  email: string,
  passwordHash: string
): Promise<User> {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  const now = new Date().toISOString();
  const rows = await db
    .insert(users)
    .values({
      email: normalized,
      passwordHash,
      createdAt: now,
    })
    .returning();
  return rows[0];
}
