/**
 * Seed: imports the exams.ro export into Postgres and uploads files to R2 (docs/PLAN.md section 6).
 *
 *   pnpm seed --dry-run      read the export, print counts, write nothing
 *   pnpm seed --only-db      database rows only
 *   pnpm seed --only-media   uploads only (rows must exist already)
 *   pnpm seed                both
 *
 * Idempotent: rows are upserted by legacy id / storage key, uploads are skipped when the
 * object exists with the same size.
 */
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { attachment, course, subject } from "@/db/schema";
import { db } from "@/lib/db";
import { loadExport } from "./lib/export";
import { pool, thumbnail, webVersion, withRetry } from "./lib/media";
import { EXPECTED, prepare, type Prepared } from "./lib/prepare";
import { R2, r2ConfigFromEnv } from "./lib/r2";

config({ path: ".env.local", quiet: true });

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const onlyDb = args.has("--only-db");
const onlyMedia = args.has("--only-media");
const doDb = !dryRun && !onlyMedia;
const doMedia = !dryRun && !onlyDb;

function chunk<T>(a: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n));
  return out;
}

function printCounts(p: Prepared) {
  const rows = Object.entries(p.counts).map(([k, v]) => {
    const exp = EXPECTED[k];
    const status = exp === undefined ? "" : exp === v ? "ok" : `MISMATCH expected ${exp}`;
    const val = k === "bytes" ? `${(v / 1048576).toFixed(1)} MB` : String(v);
    return `  ${k.padEnd(16)} ${val.padStart(10)}  ${status}`;
  });
  console.log("Prepared from export:\n" + rows.join("\n"));
  const bad = Object.entries(EXPECTED).filter(([k, v]) => p.counts[k] !== v);
  if (bad.length) {
    console.error(`\n${bad.length} count(s) differ from docs/PLAN.md section 4. Investigate before seeding.`);
    process.exitCode = 1;
  }
}

async function seedDb(p: Prepared) {
  const d = db();
  console.log("\nDatabase: upserting courses…");
  await d
    .insert(course)
    .values(p.courses.map((c) => ({ legacyId: c.legacyId, name: c.name, slug: c.slug, year: c.year, level: c.level })))
    .onConflictDoUpdate({
      target: course.legacyId,
      set: { name: sql`excluded.name`, slug: sql`excluded.slug`, year: sql`excluded.year`, level: sql`excluded.level` },
    });
  const courseIds = new Map((await d.select({ id: course.id, legacyId: course.legacyId }).from(course)).map((r) => [r.legacyId, r.id]));

  console.log("Database: upserting subjects…");
  for (const batch of chunk(p.subjects, 100)) {
    await d
      .insert(subject)
      .values(
        batch.map((s) => ({
          legacyId: s.legacyId,
          courseId: courseIds.get(s.courseLegacyId)!,
          professor: s.professor,
          examYear: s.examYear,
          session: s.session,
          series: s.series,
          groupName: s.groupName,
          contentHtml: s.contentHtml,
          contentText: s.contentText,
          posterName: s.posterName,
          hidden: s.hidden,
          createdAt: s.createdAt,
        })),
      )
      .onConflictDoUpdate({
        target: subject.legacyId,
        set: {
          courseId: sql`excluded.course_id`,
          professor: sql`excluded.professor`,
          examYear: sql`excluded.exam_year`,
          session: sql`excluded.session`,
          series: sql`excluded.series`,
          groupName: sql`excluded.group_name`,
          contentHtml: sql`excluded.content_html`,
          contentText: sql`excluded.content_text`,
          posterName: sql`excluded.poster_name`,
          hidden: sql`excluded.hidden`,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`now()`,
        },
      });
  }
  const subjectIds = new Map((await d.select({ id: subject.id, legacyId: subject.legacyId }).from(subject)).map((r) => [r.legacyId, r.id]));

  console.log("Database: upserting attachments…");
  const all = p.subjects.flatMap((s) => s.attachments);
  for (const batch of chunk(all, 200)) {
    await d
      .insert(attachment)
      .values(
        batch.map((a) => ({
          subjectId: subjectIds.get(a.subjectLegacyId)!,
          originalName: a.originalName,
          storageKey: a.storageKey,
          webKey: a.webKey,
          thumbKey: a.thumbKey,
          mime: a.mime,
          size: a.size,
          width: a.width,
          height: a.height,
          kind: a.kind,
          sortOrder: a.sortOrder,
        })),
      )
      .onConflictDoUpdate({
        target: attachment.storageKey,
        set: {
          subjectId: sql`excluded.subject_id`,
          originalName: sql`excluded.original_name`,
          webKey: sql`excluded.web_key`,
          thumbKey: sql`excluded.thumb_key`,
          mime: sql`excluded.mime`,
          size: sql`excluded.size`,
          width: sql`excluded.width`,
          height: sql`excluded.height`,
          kind: sql`excluded.kind`,
          sortOrder: sql`excluded.sort_order`,
        },
      });
  }
  const [{ c }] = await d.select({ c: sql<number>`count(*)::int` }).from(attachment);
  console.log(`Database done: ${courseIds.size} courses, ${subjectIds.size} subjects, ${c} attachments.`);
}

async function seedMedia(p: Prepared) {
  const r2 = new R2(r2ConfigFromEnv());
  const all = p.subjects.flatMap((s) => s.attachments);
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 8;
  const start = Date.now();
  console.log(`\nMedia: ${all.length} files, ${all.filter((a) => a.kind === "image").length} with derivatives…`);
  const processed = await pool(all, 3, async (a, i) => {
    try {
      const body = readFileSync(a.localPath);
      const put = async (key: string, buf: Buffer, type: string, disposition?: string) => {
        const existing = await withRetry(() => r2.sizeOf(key));
        if (existing === buf.length) {
          skipped++;
          return;
        }
        await withRetry(() => r2.put(key, buf, type, disposition));
        uploaded++;
      };
      const disposition =
        a.kind === "image"
          ? undefined
          : `attachment; filename="${a.originalName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'")}"; filename*=UTF-8''${encodeURIComponent(a.originalName)}`;
      await put(a.storageKey, body, a.mime, disposition);
      if (a.kind === "image" && a.webKey && a.thumbKey) {
        await put(a.webKey, await webVersion(a.localPath), "image/webp");
        await put(a.thumbKey, await thumbnail(a.localPath), "image/webp");
      }
      consecutiveFailures = 0;
    } catch (e) {
      failed++;
      consecutiveFailures++;
      console.error(`  FAILED ${a.storageKey}: ${(e as Error).message || "(no message)"}`);
    }
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${all.length} files, ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
  }, () => consecutiveFailures >= MAX_CONSECUTIVE_FAILURES);
  const aborted = consecutiveFailures >= MAX_CONSECUTIVE_FAILURES;
  console.log(
    `Media ${aborted ? "ABORTED after " + MAX_CONSECUTIVE_FAILURES + " consecutive failures" : "done"} in ${((Date.now() - start) / 1000).toFixed(0)}s: ` +
      `${processed}/${all.length} files processed, ${uploaded} objects uploaded, ${skipped} skipped, ${failed} files failed.`,
  );
  if (failed || aborted) process.exitCode = 1;
}

async function main() {
  const dir = process.env.EXPORT_DIR;
  if (!dir) throw new Error("EXPORT_DIR is not set (see .env.example)");
  console.log(`Reading export from ${dir}`);
  const data = loadExport(dir);
  const prepared = await prepare(data, { readImages: doDb || dryRun });
  printCounts(prepared);
  if (process.exitCode) return;
  if (dryRun) {
    console.log("\nDry run: nothing written.");
    return;
  }
  if (doDb) await seedDb(prepared);
  if (doMedia) await seedMedia(prepared);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
