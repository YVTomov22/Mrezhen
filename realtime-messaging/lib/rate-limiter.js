// Sliding-window rate limiter — per-user message throttling.
// Uses a token-bucket approach in memory. For multi-node, replace with Redis INCR/EXPIRE.

export class RateLimiter {
  constructor(maxMessages = 30, windowMs = 60_000) {
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;

    /** @type {Map<string, { count: number, resetAt: number }>} */
    this._buckets = new Map();

    // Periodically purge expired buckets to avoid memory leaks
    this._cleanupInterval = setInterval(() => this._cleanup(), windowMs * 2);
    // Allow the process to exit without waiting for this timer
    if (this._cleanupInterval.unref) this._cleanupInterval.unref();
  }

  /** Check whether a user is allowed to send a message. Increments counter. */
  consume(userId) {
    const now = Date.now();
    let bucket = this._buckets.get(userId);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this._buckets.set(userId, bucket);
    }

    bucket.count++;

    if (bucket.count > this.maxMessages) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: bucket.resetAt - now,
      };
    }

    return {
      allowed: true,
      remaining: this.maxMessages - bucket.count,
      retryAfterMs: 0,
    };
  }

  /** Remove expired buckets. */
  _cleanup() {
    const now = Date.now();
    for (const [key, bucket] of this._buckets) {
      if (now >= bucket.resetAt) this._buckets.delete(key);
    }
  }

  /** Stop the background cleanup timer (for graceful shutdown). */
  destroy() {
    clearInterval(this._cleanupInterval);
  }
}
