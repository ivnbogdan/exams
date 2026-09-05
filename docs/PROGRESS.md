# Progress

Agents: update this file at the end of every stage. Owner: the HUMAN items are in HUMAN-ACTIONS.md.

| Stage | Status | Date | Notes |
|---|---|---|---|
| 0 Repository skeleton | done | 2026-09-04 | Next 16.3.4, pnpm 11. `typecheck` runs `next typegen` first because Next 16 generates `LayoutProps`. `pnpm-workspace.yaml` must allow esbuild's build script or pnpm refuses to run any script. |
| 1 Schema and migrations | done, migration applied to Neon (PostgreSQL 18) | 2026-09-04 | `src/db/schema.ts`, `drizzle/0000_*.sql`. `legacy_id` is nullable so v2 rows can omit it. The reserved `search` column uses the 'simple' config without unaccent (unaccent is not IMMUTABLE; add a wrapper in v2). `pnpm db:check` prints tables and row counts. Neon vars exist only in Preview and Production on Vercel, so pull with `--environment=preview`; `vercel link` overwrites `.env.local`. |
| 2 Seed and media | done: database seeded, 680 files + 800 derivatives in R2 (one file retried after a network drop) | 2026-09-05 | `scripts/seed.ts` + `scripts/lib/*`. Deviations from PLAN: storage keys use the 1-based position within the subject instead of the attachment DB id (`subjects/<legacyId>/<n>-<slug>.<ext>`) so keys are deterministic before insert; `original_name` is always the on-disk filename because the DB names were mangled; `exam_date` is left null. Remaining: `pnpm seed --only-media` once the five `R2_*` values are in `.env.local` (they are sensitive on Vercel and cannot be pulled). |
| 3 Pages | built: 763 static pages (home, 4 years, master, 88 courses, 663 subjects, sitemap, robots); visual pass pending in Stage 5 | 2026-09-05 | `dynamicParams = false` everywhere, so unknown ids 404 without touching the DB. Neon client retries transient fetch errors during build. |
| 4 Search | built: MiniSearch over `/search-index.json`, facets, query hints, header quick results | 2026-09-05 | index is a `force-static` route handler |
| 5 Design | not started | | |
| 6 Deployment and cutover | first Vercel build failed: `NEXT_PUBLIC_SITE_URL` on Vercel is not a full URL. Code now tolerates it (adds https://, falls back to the Vercel hostname). Domain steps H5, H6, H10 still pending. | 2026-09-05 | Vercel vars set by the owner are sensitive; agents can only test them by deploying. |

Human actions completed: H1, H2, H3, H4, H8 (project `aptabase/exams`). Next needed: confirm `R2_PUBLIC_BASE_URL` on Vercel is the public r2.dev URL (it is sensitive there, so agents cannot read it); later H5, H6, H10 for the domain.
