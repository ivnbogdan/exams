import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

/**
 * Database client. Created lazily so that builds without DATABASE_URL still succeed
 * as long as no query runs (Stage 0 acceptance). Uses the Neon HTTP driver, which is
 * the right choice for one-shot queries from server components and scripts.
 */
let cached: ReturnType<typeof create> | undefined;

function create() {
  const sql = neon(env.databaseUrl);
  return drizzle({ client: sql, schema });
}

export function db() {
  cached ??= create();
  return cached;
}
