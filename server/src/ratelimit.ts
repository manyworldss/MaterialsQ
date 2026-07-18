/* Tiny in-memory sliding-window rate limiter. The app is free, so every AI call
   costs us money and is an abuse surface — this caps how fast one caller can
   spend. In-memory is fine for a single instance; move to Redis (we already use
   Upstash for the cache) when we run more than one. */

interface Window {
  hits: number[];
}

export class RateLimiter {
  private windows = new Map<string, Window>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  /** Returns true if this key is allowed to proceed (and records the hit). */
  take(key: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    let w = this.windows.get(key);
    if (!w) {
      w = { hits: [] };
      this.windows.set(key, w);
    }
    // Drop timestamps outside the window.
    w.hits = w.hits.filter((t) => t > cutoff);
    if (w.hits.length >= this.max) return false;
    w.hits.push(now);
    return true;
  }

  /** Periodically drop empty windows so the map doesn't grow unbounded. */
  sweep(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [key, w] of this.windows) {
      if (w.hits.every((t) => t <= cutoff)) this.windows.delete(key);
    }
  }
}
