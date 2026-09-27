import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/security";
import { rateLimit, resetMemoryRateLimit } from "@/lib/rate-limit";

describe("Security: Rate Limiting & Brute-Force Throttling (FR-SEC-04, FR-SEC-07)", () => {
  beforeEach(() => {
    resetRateLimit("test-ip-1");
    resetRateLimit("test-ip-2");
    resetMemoryRateLimit("rl:user-1");
    resetMemoryRateLimit("rl:user-2");
  });

  it("TC-SEC-RATE-01: checkRateLimit allows requests strictly within quota", () => {
    const key = "test-ip-1";
    const res1 = checkRateLimit(key, 3, 60000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(key, 3, 60000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(key, 3, 60000);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("TC-SEC-RATE-02: checkRateLimit blocks excess requests once threshold is breached", () => {
    const key = "test-ip-1";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60000);
    }

    const blocked = checkRateLimit(key, 5, 60000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("TC-SEC-RATE-03: checkRateLimit returns accurate future reset timestamp", () => {
    const now = Date.now();
    const key = "test-ip-1";
    const res = checkRateLimit(key, 5, 10000);

    expect(res.resetTime).toBeGreaterThanOrEqual(now + 9000);
    expect(res.resetTime).toBeLessThanOrEqual(now + 11000);
  });

  it("TC-SEC-RATE-04: checkRateLimit isolates quotas between different client identifiers", () => {
    const key1 = "test-ip-1";
    const key2 = "test-ip-2";

    // Exhaust key 1
    for (let i = 0; i < 2; i++) {
      checkRateLimit(key1, 2, 60000);
    }
    expect(checkRateLimit(key1, 2, 60000).allowed).toBe(false);

    // Key 2 remains untouched and allowed
    const resKey2 = checkRateLimit(key2, 2, 60000);
    expect(resKey2.allowed).toBe(true);
    expect(resKey2.remaining).toBe(1);
  });

  it("TC-SEC-RATE-05: resetRateLimit clears counter for successful authentication reset", () => {
    const key = "test-ip-1";
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60000);
    }
    expect(checkRateLimit(key, 3, 60000).allowed).toBe(false);

    resetRateLimit(key);

    const afterReset = checkRateLimit(key, 3, 60000);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(2);
  });

  it("TC-SEC-RATE-06: rateLimit memory fallback blocks requests over limit and returns rate limit headers", async () => {
    const key = "rl:user-1";
    const limit = 3;

    const r1 = await rateLimit(key, limit);
    const r2 = await rateLimit(key, limit);
    const r3 = await rateLimit(key, limit);
    const r4 = await rateLimit(key, limit);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(true);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
  });
});
