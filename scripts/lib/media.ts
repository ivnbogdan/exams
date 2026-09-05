/** Image derivatives (PLAN 6.11). EXIF rotation is applied before resizing. */
import sharp from "sharp";

// Keep memory flat: no libvips operation cache, and few internal threads. The pool above the
// pipeline already provides parallelism; the OS killed a run with the defaults.
sharp.cache(false);
sharp.concurrency(1);

export async function webVersion(path: string): Promise<Buffer> {
  return sharp(path, { failOn: "none" })
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

export async function thumbnail(path: string): Promise<Buffer> {
  return sharp(path, { failOn: "none" })
    .rotate()
    .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
}

/** Tiny concurrency pool. `shouldStop` is consulted before each item so a run can abort early. */
export async function pool<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
  shouldStop: () => boolean = () => false,
): Promise<number> {
  let next = 0;
  let processed = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length && !shouldStop()) {
      const i = next++;
      await fn(items[i], i);
      processed++;
    }
  });
  await Promise.all(workers);
  return processed;
}

const NETWORK_ERRORS = /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE|EADDRNOTAVAIL|ECONNREFUSED|socket hang up|TLS connection|network|timeout/i;

export function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  return NETWORK_ERRORS.test(msg) || msg.trim() === "Error" || msg.trim() === "";
}

/** Retries `fn` on network errors with exponential backoff: 1s, 3s, 9s, 27s. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let delay = 1000;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= attempts || !isNetworkError(e)) throw e;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 3;
    }
  }
}
