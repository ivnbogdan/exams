# Progress

Agents: update this file at the end of every stage. Owner: the HUMAN items are in HUMAN-ACTIONS.md.

| Stage | Status | Date | Notes |
|---|---|---|---|
| 0 Repository skeleton | done | 2026-09-04 | Next 16.3.4, pnpm 11. `typecheck` runs `next typegen` first because Next 16 generates `LayoutProps`. `pnpm-workspace.yaml` must allow esbuild's build script or pnpm refuses to run any script. |
| 1 Schema and migrations | done, migration applied to Neon (PostgreSQL 18) | 2026-09-04 | `src/db/schema.ts`, `drizzle/0000_*.sql`. `legacy_id` is nullable so v2 rows can omit it. The reserved `search` column uses the 'simple' config without unaccent (unaccent is not IMMUTABLE; add a wrapper in v2). `pnpm db:check` prints tables and row counts. Neon vars exist only in Preview and Production on Vercel, so pull with `--environment=preview`; `vercel link` overwrites `.env.local`. |
| 2 Seed and media | database half done (88 courses, 708 subjects, 680 attachment rows in Neon, re-run is a no-op); media upload blocked on R2 values in `.env.local` | 2026-09-04 | `scripts/seed.ts` + `scripts/lib/*`. Deviations from PLAN: storage keys use the 1-based position within the subject instead of the attachment DB id (`subjects/<legacyId>/<n>-<slug>.<ext>`) so keys are deterministic before insert; `original_name` is always the on-disk filename because the DB names were mangled; `exam_date` is left null. Remaining: `pnpm seed --only-media` once the five `R2_*` values are in `.env.local` (they are sensitive on Vercel and cannot be pulled). |
| 3 Pages | not started | | can start before H4 with the schema in place, but acceptance needs seeded data |
| 4 Search | not started | | |
| 5 Design | not started | | |
| 6 Deployment and cutover | blocked on H3, H9, H10 | | |

Human actions completed: H1, H2, H3, H4, H8 (project `aptabase/exams`). Next needed: H7 values placed in `.env.local` by the owner (sensitive Vercel vars cannot be pulled), then the real seed run.
