import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetMemoryRateLimit } from "@/lib/rate-limit";

describe("rate-limit In-Memory Sliding Window Suite", () => {
  beforeEach(() => {
    resetMemoryRateLimit("test-key-1");
    resetMemoryRateLimit("test-key-2");
  });

  // TC-BUS-RL-01: First request
  it("TC-BUS-RL-01: allows first request and initializes remaining tokens", async () => {
    const result = await rateLimit("test-key-1", 5);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
  });

  // TC-BUS-RL-02: Decrementing remaining tokens
  it("TC-BUS-RL-02: decrements remaining tokens on consecutive calls within window", async () => {
    await rateLimit("test-key-1", 5);
    const second = await rateLimit("test-key-1", 5);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(3);
  });

  // TC-BUS-RL-03: Blocking on limit reached
  it("TC-BUS-RL-03: blocks requests when limit is exhausted", async () => {
    for (let i = 0; i < 3; i++) {
      await rateLimit("test-key-1", 3);
    }
    const blocked = await rateLimit("test-key-1", 3);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  // TC-BUS-RL-04: Reset clears count
  it("TC-BUS-RL-04: resetMemoryRateLimit clears memory record and allows immediate access", async () => {
    for (let i = 0; i < 3; i++) {
      await rateLimit("test-key-1", 3);
    }
    expect((await rateLimit("test-key-1", 3)).success).toBe(false);

    resetMemoryRateLimit("test-key-1");
    const allowedAfterReset = await rateLimit("test-key-1", 3);
    expect(allowedAfterReset.success).toBe(true);
    expect(allowedAfterReset.remaining).toBe(2);
  });

  // TC-BUS-RL-05: Key isolation
  it("TC-BUS-RL-05: isolates counters between different client keys", async () => {
    for (let i = 0; i < 2; i++) {
      await rateLimit("test-key-1", 2);
    }
    expect((await rateLimit("test-key-1", 2)).success).toBe(false);

    const otherKeyResult = await rateLimit("test-key-2", 2);
    expect(otherKeyResult.success).toBe(true);
  });
});
