// Rate-limit storage adapter. v1 = in-process Map (fine for single-instance dev
// and small self-hosted deploys). v2 swap target: Upstash Redis or a Redis
// instance via ioredis. Same interface, no caller changes.
//
// The Map is bounded by a periodic sweep: any bucket idle longer than IDLE_MS
// is dropped to bound memory.

import {
  consume,
  freshBucket,
  type BucketState,
  type RateLimitConfig,
  type RateLimitDecision,
} from "@/domain/rate-limit/token-bucket";

export interface RateLimitStore {
  check(key: string, config: RateLimitConfig, cost?: number): Promise<RateLimitDecision>;
}

const IDLE_MS = 60 * 60 * 1000; // 1 hour

class InMemoryRateLimitStore implements RateLimitStore {
  private map = new Map<string, BucketState>();
  private lastSweepAt = 0;

  async check(
    key: string,
    config: RateLimitConfig,
    cost: number = 1,
  ): Promise<RateLimitDecision> {
    const now = Date.now();
    if (now - this.lastSweepAt > IDLE_MS) this.sweep(now);

    const state = this.map.get(key) ?? freshBucket(config, now);
    const decision = consume(state, config, cost, now);
    this.map.set(key, decision.newState);
    return decision;
  }

  private sweep(now: number) {
    for (const [k, v] of this.map) {
      if (now - v.lastRefillAt > IDLE_MS) this.map.delete(k);
    }
    this.lastSweepAt = now;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore__: RateLimitStore | undefined;
}

export const rateLimitStore: RateLimitStore =
  globalThis.__rateLimitStore__ ?? new InMemoryRateLimitStore();

if (process.env.NODE_ENV !== "production") {
  globalThis.__rateLimitStore__ = rateLimitStore;
}

// Pre-tuned configs for the public surfaces.
export const RATE_LIMITS = {
  publicContact: { capacity: 5, refillPerSecond: 5 / 3600 } satisfies RateLimitConfig, // 5/hour
  publicRegister: { capacity: 3, refillPerSecond: 3 / 3600 } satisfies RateLimitConfig, // 3/hour
  publicReadDefault: { capacity: 60, refillPerSecond: 1 } satisfies RateLimitConfig, // 60/min
} as const;
