/** Image derivatives (PLAN 6.11). EXIF rotation is applied before resizing. */
import sharp from "sharp";

export async function webVersion(path: string): Promise<Buffer> {
  return sharp(path)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

export async function thumbnail(path: string): Promise<Buffer> {
  return sharp(path)
    .rotate()
    .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
}

/** Tiny concurrency pool. */
export async function pool<T>(items: T[], limit: number, fn: (item: T, index: number) => Promise<void>): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}
