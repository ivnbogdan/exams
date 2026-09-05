import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

/**
 * Database client. Created lazily so that builds without DATABASE_URL still succeed
 * as long as no query runs (Stage 0 acceptance). Uses the Neon HTTP driver, which is
 * the right choice for one-shot queries from server components and scripts.
 *
 * Transient network failures (a dropped connection during `next build`, which issues
 * thousands of small queries) are retried with backoff. Every query in this app is a
 * SELECT or an idempotent upsert, so retrying is safe.
 */
const RETRY_DELAYS_MS = [500, 1500, 4500, 9000];

function isTransient(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.name} ${e.message} ${String((e as { cause?: unknown }).cause ?? "")}` : String(e);
  return /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE|socket hang up|network|timeout|UND_ERR/i.test(msg);
}

const retryingFetch: typeof fetch = async (input, init) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(input, init);
    } catch (e) {
      if (attempt >= RETRY_DELAYS_MS.length || !isTransient(e)) throw e;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
  }
};

neonConfig.fetchFunction = retryingFetch;

let cached: ReturnType<typeof create> | undefined;

function create() {
  const sql = neon(env.databaseUrl);
  return drizzle({ client: sql, schema });
}

export function db() {
  cached ??= create();
  return cached;
}
