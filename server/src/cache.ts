/* Persistent TTL + LRU cache for review summaries.

   Why: summarizing is the one paid AI call. Commonly-viewed products (the same
   Uniqlo tee seen by thousands of shoppers) should be summarized ONCE and reused
   until the entry expires — not re-summarized per visit. Keyed by product
   identity (normalized URL), so the cache is shared across users.

   Storage: a JSON file on disk, hydrated into memory on boot, flushed atomically
   (tmp file + rename) on a short debounce. Zero dependencies. For multi-instance
   production, swap this class for Redis/Postgres behind the same get/set shape. */

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

interface Entry<T> {
  v: T;
  exp: number; // epoch ms expiry
}

import { Redis } from '@upstash/redis';

export interface ICache<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, v: T): Promise<void>;
  get size(): number; // for health checks (0 for redis)
}

export class PersistentCache<T> implements ICache<T> {
  private map = new Map<string, Entry<T>>(); // insertion order == LRU recency
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private file: string,
    private ttlMs: number,
    private max: number,
  ) {
    this.hydrate();
    // Best-effort flush on shutdown so nothing in the debounce window is lost.
    for (const sig of ['SIGINT', 'SIGTERM', 'beforeExit'] as const) {
      process.once(sig, () => this.flushNow());
    }
  }

  async get(key: string): Promise<T | undefined> {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.exp < Date.now()) {
      this.map.delete(key);
      this.scheduleFlush();
      return undefined;
    }
    // Refresh LRU recency.
    this.map.delete(key);
    this.map.set(key, e);
    return e.v;
  }

  async set(key: string, v: T): Promise<void> {
    this.map.delete(key);
    this.map.set(key, { v, exp: Date.now() + this.ttlMs });
    // Evict oldest while over capacity.
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
    this.scheduleFlush();
  }

  get size(): number {
    return this.map.size;
  }

  private hydrate(): void {
    try {
      if (!existsSync(this.file)) return;
      const raw = JSON.parse(readFileSync(this.file, 'utf8')) as [string, Entry<T>][];
      const now = Date.now();
      for (const [k, e] of raw) {
        if (e && e.exp > now) this.map.set(k, e);
      }
    } catch (err) {
      console.warn('[cache] hydrate failed, starting empty:', (err as Error).message);
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.flushNow(), 2000);
    this.flushTimer.unref?.();
  }

  private flushNow(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    try {
      const tmp = `${this.file}.tmp`;
      writeFileSync(tmp, JSON.stringify([...this.map.entries()]));
      renameSync(tmp, this.file); // atomic replace
    } catch (err) {
      console.warn('[cache] flush failed:', (err as Error).message);
    }
  }
}

export class UpstashCache<T> implements ICache<T> {
  private redis: import('@upstash/redis').Redis;

  constructor(
    url: string,
    token: string,
    private ttlSeconds: number,
  ) {
    this.redis = new Redis({ url, token });
  }

  async get(key: string): Promise<T | undefined> {
    try {
      const data = await this.redis.get<T>(key);
      return data === null ? undefined : data;
    } catch (err) {
      console.warn('[upstash] get failed:', err);
      return undefined;
    }
  }

  async set(key: string, v: T): Promise<void> {
    try {
      await this.redis.set(key, v, { ex: this.ttlSeconds });
    } catch (err) {
      console.warn('[upstash] set failed:', err);
    }
  }

  get size(): number {
    return 0; // Not efficiently trackable for Redis without scanning
  }
}

/* Product identity key: normalize the URL so color/size variants and tracking
   params collapse to one product. Falls back to null when no URL is given. */
export function productKeyFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, '');
    return `${u.hostname.toLowerCase()}${path}`;
  } catch {
    return null;
  }
}
