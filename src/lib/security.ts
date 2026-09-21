import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeReturnUrl } from "@/lib/url-utils";

/**
 * Enforces that the incoming request has a valid authenticated session.
 * Throws redirect to /login if unauthenticated.
 */
export async function requireAuth(returnUrl?: string): Promise<SessionUser> {
  const session = await auth();

  if (!session || !session.user) {
    const safeUrl = sanitizeReturnUrl(returnUrl, "");
    const destination = safeUrl ? `/login?returnUrl=${encodeURIComponent(safeUrl)}` : "/login";
    redirect(destination);
  }

  return session.user;
}

/**
 * Enforces strict Administrator privileges on Server Components and Server Actions.
 * 1. Verifies authenticated session.
 * 2. Real-time PostgreSQL database check verifying role === 'ADMIN' and isActive === true.
 * 3. Logs unauthorized attempts to AuditLog table.
 * 4. Throws 403 Forbidden or redirects.
 */
export async function requireAdmin(returnUrl: string = "/secure-console-x7"): Promise<SessionUser> {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || user.role !== Role.ADMIN) {
    // Log security violation to AuditLog table
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT",
          entity: "AdminConsole",
          entityId: returnUrl,
          details: JSON.stringify({
            attemptedBy: session.user.email,
            actualRole: user?.role || "UNKNOWN",
            isActive: user?.isActive ?? false,
          }),
        },
      });
    } catch (auditError) {
      console.error("Failed to record security audit log:", auditError);
    }

    throw new Error("403 Forbidden: Administrator privileges required.");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/**
 * Records an authorized administrative mutation in the AuditLog.
 */
export async function logAudit(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("Error writing audit log:", error);
  }
}

// In-Memory Sliding Window Rate Limiter for Authentication Protection
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Sliding window in-memory rate limiter.
 * Default: 5 attempts per 15 minutes per key.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count, resetTime: record.resetTime };
}

/**
 * Resets rate limit for a key upon successful authentication.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
