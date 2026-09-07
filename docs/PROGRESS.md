# Progress

Agents: update this file at the end of every stage. Owner: the HUMAN items are in HUMAN-ACTIONS.md.

| Stage | Status | Date | Notes |
|---|---|---|---|
| 0 Repository skeleton | done | 2026-09-04 | Next 16.3.4, pnpm 11. `typecheck` runs `next typegen` first because Next 16 generates `LayoutProps`. `pnpm-workspace.yaml` must allow esbuild's build script or pnpm refuses to run any script. |
| 1 Schema and migrations | done, migration applied to Neon (PostgreSQL 18) | 2026-09-04 | `src/db/schema.ts`, `drizzle/0000_*.sql`. `legacy_id` is nullable so v2 rows can omit it. The reserved `search` column uses the 'simple' config without unaccent (unaccent is not IMMUTABLE; add a wrapper in v2). `pnpm db:check` prints tables and row counts. Neon vars exist only in Preview and Production on Vercel, so pull with `--environment=preview`; `vercel link` overwrites `.env.local`. |
| 2 Seed and media | done: database seeded, 680 files + 800 derivatives in R2 (one file retried after a network drop) | 2026-09-05 | `scripts/seed.ts` + `scripts/lib/*`. Deviations from PLAN: storage keys use the 1-based position within the subject instead of the attachment DB id (`subjects/<legacyId>/<n>-<slug>.<ext>`) so keys are deterministic before insert; `original_name` is always the on-disk filename because the DB names were mangled; `exam_date` is left null. Remaining: `pnpm seed --only-media` once the five `R2_*` values are in `.env.local` (they are sensitive on Vercel and cannot be pulled). |
| 3 Pages | built; URLs are hierarchical since 2026-09-07 (`/an/2/<course>/<id>`, `/master/<course>/<id>`), old `/curs` and `/subiect` addresses redirect; 1515 static pages | 2026-09-07 | `dynamicParams = false` everywhere, so unknown ids 404 without touching the DB. Subjects whose files were lost on the old server carry `lost_files` and show a note (13 visible cases). Neon client retries transient fetch errors during build. |
| 4 Search | built: MiniSearch over `/search-index.json`, facets, query hints, header quick results | 2026-09-05 | index is a `force-static` route handler |
| 5 Design | mark redrawn from the 2011 banner; dark mode follows the system setting, with a system/light/dark toggle in the header whose choice is stored in the browser and applied before first paint; focus rings and skip link; OG image from the mark; home page Lighthouse accessibility, best practices and SEO all 100; screenshots in `docs/screenshots/` | 2026-09-07 | tokens live in `src/app/globals.css` (`@theme inline` over `:root` variables); components use `bg-card`, `text-muted`, `border-line` etc., never raw black/white |
| 6 Deployment and cutover | production deploy green on Vercel (exams-sooty.vercel.app); domain steps H5, H6, H10 pending | 2026-09-05 | `NEXT_PUBLIC_SITE_URL` code now tolerates a schemeless value. `R2_PUBLIC_BASE_URL` on Vercel was an empty placeholder and was replaced with the r2.dev URL via CLI. The other `R2_*` values on Vercel are unverified placeholders from 17h before; they matter only for v2 uploads. `EXPORT_DIR` on Vercel is unnecessary. |

Human actions completed: H1, H2, H3, H4, H7, H8, H9.

## Remaining (exact list lives in PLAN.md section 0)
- Human: H5 Cloudflare zone → H6 nameservers → H7b `files.exams.ro` on the bucket → H10 domain on Vercel → H11 cancel old hosting → H12 real R2 keys on Vercel before v2.
- Agent: A1 switch `R2_PUBLIC_BASE_URL` to `https://files.exams.ro` (after H7b) → A2 set `NEXT_PUBLIC_SITE_URL=https://exams.ro` on Vercel and redeploy (after H10; production sitemap currently lists the Vercel hostname) → A3 cutover verification → A4 mobile performance score on a subject page (PageSpeed quota was exhausted on 2026-09-07) → A5 lightbox keyboard check → A6 docs.
- Verified on 2026-09-07: Stage 4 acceptance queries (protocoale, sinteza elementara, tapus 2015, 321CA, restante analiza, a typo query) all return the expected top results against the live index.
