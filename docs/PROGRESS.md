# Progress

Agents: update this file at the end of every stage. Owner: the HUMAN items are in HUMAN-ACTIONS.md.

| Stage | Status | Date | Notes |
|---|---|---|---|
| 0 Repository skeleton | done | 2026-09-04 | Next 16.3.4, pnpm 11. `typecheck` runs `next typegen` first because Next 16 generates `LayoutProps`. `pnpm-workspace.yaml` must allow esbuild's build script or pnpm refuses to run any script. |
| 1 Schema and migrations | schema + migration SQL done, apply blocked on H4 | 2026-09-04 | `src/db/schema.ts`, `drizzle/0000_*.sql`. `legacy_id` is nullable so v2 rows can omit it. The reserved `search` column uses the 'simple' config without unaccent (unaccent is not IMMUTABLE; add a wrapper in v2). Remaining: `pnpm db:migrate` against Neon once `DATABASE_URL` exists. |
| 2 Seed and media | blocked on H7, H9 | | needs R2 credentials and `EXPORT_DIR` |
| 3 Pages | not started | | can start before H4 with the schema in place, but acceptance needs seeded data |
| 4 Search | not started | | |
| 5 Design | not started | | |
| 6 Deployment and cutover | blocked on H3, H9, H10 | | |

Human actions completed: H1, H2. Next needed: H3 and H4 (Vercel project + Neon), then H5 and H7 (Cloudflare + R2).
