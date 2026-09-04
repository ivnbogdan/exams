/** Prints what is in the database: tables, migrations, row counts. Read-only. `pnpm db:check` */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local", quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  const tables = await sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`;
  const indexes = await sql`select indexname from pg_indexes where schemaname = 'public' order by 1`;
  const migrations = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
  const version = await sql`select version()`;
  console.log("server:    ", String(version[0].version).split(" on ")[0]);
  console.log("migrations:", migrations[0].n);
  console.log("tables:    ", tables.map((t) => t.table_name).join(", ") || "(none)");
  console.log("indexes:   ", indexes.map((i) => i.indexname).join(", ") || "(none)");
  for (const t of ["course", "subject", "attachment"]) {
    if (!tables.some((x) => x.table_name === t)) continue;
    const [{ n }] = await sql.query(`select count(*)::int as n from "${t}"`);
    console.log(`rows in ${t}:`.padEnd(20), n);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
