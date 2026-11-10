import crypto from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(crypto.scrypt);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Pre-computed valid dummy hash with same parameters to ensure constant-time
 * execution during login attempts for non-existent users.
 */
export const DUMMY_HASH =
  "scrypt$dGVzdHNhbHQxMjM0NTY3OA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

/**
 * Hash a plaintext password using Node's built-in crypto.scrypt.
 * Output format: scrypt$<saltB64>$<hashB64>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt.toString("base64")}$${derivedKey.toString("base64")}`;
}

/**
 * Timing-safe password verification.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      return false;
    }

    const salt = Buffer.from(parts[1], "base64");
    const expectedKey = Buffer.from(parts[2], "base64");

    if (salt.length === 0 || expectedKey.length === 0) {
      return false;
    }

    const derivedKey = (await scryptAsync(
      password,
      salt,
      expectedKey.length
    )) as Buffer;

    if (derivedKey.length !== expectedKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}
