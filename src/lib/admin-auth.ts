import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "mm_admin_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface SessionPayload {
  user: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set and at least 32 characters");
  }
  return secret;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function createSessionToken(user: string): {
  token: string;
  maxAgeSeconds: number;
} {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload: SessionPayload = { user, exp };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body, getSecret());
  return { token: `${body}.${signature}`, maxAgeSeconds: SESSION_TTL_SECONDS };
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return null;
  }

  const expected = sign(body, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.user !== "string" || payload.user.length === 0) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;
  const userOk = safeEqual(username, expectedUser);
  const passOk = safeEqual(password, expectedPass);
  return userOk && passOk;
}
