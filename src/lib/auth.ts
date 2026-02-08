import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import crypto from "crypto";

const COOKIE_NAME = "admin_token";
const TOKEN_EXPIRY = "24h";
const MAX_AGE = 60 * 60 * 24; // 24h in seconds

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function getJwtSecret(): Uint8Array {
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    try {
      const envPath = join(process.cwd(), ".env");
      const envContent = readFileSync(envPath, "utf-8");
      writeFileSync(envPath, envContent.trimEnd() + `\nJWT_SECRET="${secret}"\n`);
    } catch {
      // If .env write fails, still use the generated secret for this session
    }
    process.env.JWT_SECRET = secret;
  }
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: { userId: string; username: string }): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ userId: string; username: string } | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as { userId: string; username: string };
  } catch {
    return null;
  }
}

export function getAuthCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}${secure}`;
}

export function getClearCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

export { COOKIE_NAME };
