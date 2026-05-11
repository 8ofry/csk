import { describe, expect, it } from "vitest";
import { consume, freshBucket } from "@/domain/rate-limit/token-bucket";

describe("token-bucket rate limiter", () => {
  const config = { capacity: 5, refillPerSecond: 1 }; // 5 burst, 1/sec sustain
  const t0 = 1_700_000_000_000;

  it("fresh bucket allows up to capacity in a burst", () => {
    let state = freshBucket(config, t0);
    for (let i = 0; i < 5; i++) {
      const d = consume(state, config, 1, t0);
      expect(d.allowed).toBe(true);
      state = d.newState;
    }
    const blocked = consume(state, config, 1, t0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("refills at the configured rate", () => {
    let state = freshBucket(config, t0);
    // Drain
    for (let i = 0; i < 5; i++) state = consume(state, config, 1, t0).newState;
    // After 3 seconds we should have ~3 tokens back
    const d = consume(state, config, 1, t0 + 3000);
    expect(d.allowed).toBe(true);
    expect(d.tokensRemaining).toBeCloseTo(2, 0);
  });

  it("never refills beyond capacity", () => {
    let state = freshBucket(config, t0);
    // Drain to 0
    for (let i = 0; i < 5; i++) state = consume(state, config, 1, t0).newState;
    // Wait an hour
    const d = consume(state, config, 1, t0 + 3_600_000);
    expect(d.allowed).toBe(true);
    expect(d.tokensRemaining).toBeLessThanOrEqual(config.capacity - 1);
  });

  it("retryAfter scales with deficit", () => {
    let state = freshBucket(config, t0);
    for (let i = 0; i < 5; i++) state = consume(state, config, 1, t0).newState;
    // Try to consume 3 more — deficit 3, refill 1/sec → 3 sec
    const d = consume(state, config, 3, t0);
    expect(d.allowed).toBe(false);
    expect(d.retryAfterSeconds).toBe(3);
  });

  it("rejects invalid input", () => {
    const state = freshBucket(config, t0);
    expect(() => consume(state, config, 0, t0)).toThrow();
    expect(() => consume(state, { capacity: 0, refillPerSecond: 1 }, 1, t0)).toThrow();
  });

  it("simulated 5-per-hour public-contact limit", () => {
    const contactCfg = { capacity: 5, refillPerSecond: 5 / 3600 };
    let state = freshBucket(contactCfg, t0);
    for (let i = 0; i < 5; i++) {
      state = consume(state, contactCfg, 1, t0 + i * 1000).newState;
    }
    // 6th request immediately = denied
    const denied = consume(state, contactCfg, 1, t0 + 6 * 1000);
    expect(denied.allowed).toBe(false);
    // Wait 12 minutes (1 token refilled at 5/hour) → allowed
    const okLater = consume(state, contactCfg, 1, t0 + 12 * 60 * 1000);
    expect(okLater.allowed).toBe(true);
  });
});
