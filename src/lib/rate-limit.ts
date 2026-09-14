import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory sliding window fallback for environments without Upstash credentials
interface MemoryRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, MemoryRecord>();

function memoryRateLimit(
  key: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { success: true, limit, remaining: limit - record.count, reset: record.resetTime };
}

export function resetMemoryRateLimit(key: string): void {
  memoryStore.delete(key);
}

let upstashLimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: 'rl:vocab',
    });
  } catch (err) {
    console.warn('Failed to initialize Upstash Redis rate limiter, using memory fallback:', err);
  }
}

/**
 * Rate limits actions to configurable requests per minute (default: 30).
 */
export async function rateLimit(
  key: string,
  limit: number = 30
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (upstashLimiter) {
    try {
      const result = await upstashLimiter.limit(key);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (err) {
      console.warn('Upstash rate limit request failed, falling back to memory:', err);
      return memoryRateLimit(key, limit, 60 * 1000);
    }
  }

  return memoryRateLimit(key, limit, 60 * 1000);
}
