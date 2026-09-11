import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "readtoimprove_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Session {
  user: SessionUser;
}

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  [key: string]: unknown;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "default-insecure-secret-minimum-32-chars-key-2026!";
  return new TextEncoder().encode(secret);
}

/**
 * Signs a cryptographic JWT session token with HMAC-SHA256.
 */
export async function signSessionToken(payload: SessionUser): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({
    sub: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

/**
 * Verifies and decodes a cryptographic JWT session token.
 */
export async function verifySessionToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Sets the secure HTTP-only session cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Clears the session cookie upon logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Central session resolver for Server Components, Server Actions, and Route Handlers.
 * Verifies the signed cookie and queries PostgreSQL to ensure user account is active.
 */
export async function auth(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    const payload = await verifySessionToken(sessionToken);
    if (!payload || !payload.sub) {
      return null;
    }

    // Real-time verification of user status and role against PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch {
    return null;
  }
}
