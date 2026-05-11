// Token-bucket rate limiter — pure logic.
// Used to throttle abuse on public endpoints (contact form, register-trainee).
//
// Each bucket has a capacity and a per-second refill rate. Calling `consume()`
// returns whether the request fits and the updated bucket state. Storage is
// abstracted: in-memory Map for v1, Redis/Upstash for v2 (NFR-MNT-02).

export interface BucketState {
  /** Current tokens available (float; may be fractional during refill). */
  tokens: number;
  /** Last refill timestamp (ms since epoch). */
  lastRefillAt: number;
}

export interface RateLimitConfig {
  /** Maximum tokens the bucket holds. */
  capacity: number;
  /** Tokens added per second (e.g. capacity 5 + refill 5/3600 = 5/hour). */
  refillPerSecond: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  tokensRemaining: number;
  /** Seconds the caller must wait before another attempt would succeed. 0 if allowed. */
  retryAfterSeconds: number;
  newState: BucketState;
}

/** Initial state for a fresh bucket — full of tokens. */
export function freshBucket(config: RateLimitConfig, now: number = Date.now()): BucketState {
  return { tokens: config.capacity, lastRefillAt: now };
}

/**
 * Try to consume `cost` tokens (default 1). Returns the decision + the updated
 * bucket so the caller can persist it back to storage.
 */
export function consume(
  state: BucketState,
  config: RateLimitConfig,
  cost: number = 1,
  now: number = Date.now(),
): RateLimitDecision {
  if (cost <= 0) throw new Error("cost must be positive");
  if (config.capacity <= 0) throw new Error("capacity must be positive");

  // Refill since last seen, capped at capacity.
  const elapsedSec = Math.max(0, (now - state.lastRefillAt) / 1000);
  const refilled = Math.min(config.capacity, state.tokens + elapsedSec * config.refillPerSecond);
  const refilledState: BucketState = { tokens: refilled, lastRefillAt: now };

  if (refilled >= cost) {
    return {
      allowed: true,
      tokensRemaining: refilled - cost,
      retryAfterSeconds: 0,
      newState: { tokens: refilled - cost, lastRefillAt: now },
    };
  }

  const deficit = cost - refilled;
  const retryAfterSeconds = Math.ceil(deficit / config.refillPerSecond);
  return {
    allowed: false,
    tokensRemaining: refilled,
    retryAfterSeconds,
    newState: refilledState,
  };
}
