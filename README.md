# exams.ro

Archive of exam subjects from Politehnica București, Facultatea de Automatică și Calculatoare.
Read-only rebuild of the 2011 site. Next.js, Neon Postgres, Cloudflare R2, deployed on Vercel.

The plan that drives implementation is `docs/PLAN.md`. The owner's checklist is `docs/HUMAN-ACTIONS.md`.

## Local setup

```
pnpm install
cp .env.example .env.local   # fill in the values
pnpm db:migrate              # apply migrations to the database
pnpm seed --dry-run          # verify the export is readable and counts match
pnpm seed                    # import content and upload files
pnpm dev                     # http://localhost:3000
```

Checks: `pnpm lint && pnpm typecheck && pnpm build`.

No content lives in this repository. Subjects are in the database, files are in R2, and both are
populated by `scripts/seed.ts` from a local export that is never committed.
