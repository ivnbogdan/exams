# exams.ro v1 rebuild — implementation plan

Audience: implementing agents. Read the whole document before starting. Stages are sequential.
Every stage ends with acceptance criteria; do not start the next stage until they pass.
Anything marked **HUMAN** cannot be done by an agent. Everything else is agent work.
Decisions in section 2 are final; do not re-open them. If something is impossible as written,
stop and report, do not improvise a different architecture.

Companion file: `docs/HUMAN-ACTIONS.md` is the checklist for the owner. Keep both in sync.

---

## 0. Status and remaining work (hand-over, updated 2026-09-07 evening)

Read this section first; it supersedes the stage tables below for "what to do next". Sections 1 to 13
remain the reference for how the system is built.

### Where things are

| Piece | Location / value |
|---|---|
| Live site | https://exams.ro (production, apex is primary; `www.exams.ro` redirects to it) |
| Vercel | team `aptabase`, project `exams`; production alias also at https://exams-sooty.vercel.app; Git integration on `main`, every push deploys |
| Repo | https://github.com/ivnbogdan/exams, branch `main`; local clone `~/repos/personal/exams` (linked with `vercel link`) |
| Database | Neon Postgres, created through the Vercel Marketplace; `DATABASE_URL` in Preview+Production on Vercel and in `.env.local`; 88 courses, 708 subjects (45 hidden), 680 attachments; 2 migrations applied |
| Files | Cloudflare R2 bucket `exams-ro-files` (account of the Cloudflare zone), 1,480 objects; public through the custom domain `https://files.exams.ro` (`R2_PUBLIC_BASE_URL` on Vercel and locally) |
| DNS | zone `exams.ro` on Cloudflare (nameservers `brad`/`pat.ns.cloudflare.com`); `exams.ro` and `www` are DNS-only CNAMEs to the Vercel target `8fd192447c79c758.vercel-dns-017.com`; `files` is the proxied R2 record |
| Source data | `~/repos/personal/exams-ro-export/` on Bogdan's Mac: the only copy of the 2011 export (SQL dump, JSON, 681 files). Never commit it. `EXPORT_DIR` in `.env.local` points at it |
| Old hosting | gazduire.ro cPanel account `examscb`, still active, still serving the old PHP site if reached by IP `81.181.252.2`; no DNS points at it any more |

Stages 0 to 5 are complete; Stage 6 is complete except the items below. Acceptance evidence is in
`docs/PROGRESS.md` (counts, Lighthouse 100/100/100 on the home page for accessibility, best
practices and SEO; search acceptance queries; lightbox keyboard check; cutover checks from public DNS).

### Remaining steps

Each step says who does it. "Agent" steps can be done by any agent with this repo, `.env.local`
and the Vercel CLI login (`npx --yes vercel@latest whoami` must print `ivnbogdan`; if not, the owner
runs `npx --yes vercel@latest login` first). Verification commands are included so nothing is taken
on faith.

#### R1 — Cloudflare DNS cleanup (owner, 2 minutes)
In Cloudflare → `exams.ro` → DNS → Records, delete the two `NS` records with name `exams.ro` and
content `ns1.vercel-dns.com` / `ns2.vercel-dns.com`. They came from a Vercel banner that applies
only when Vercel hosts the DNS, which it must not (the files domain needs Cloudflare). Cloudflare
ignores them at the apex, so they are harmless, but a future reader will misinterpret them.
Keep everything else: `exams.ro` CNAME and `www` CNAME (DNS only, grey cloud) and `files` (R2, proxied).
Verify: `dig +short @1.1.1.1 exams.ro NS` still prints the two Cloudflare names, and
`dig +short @1.1.1.1 exams.ro A` prints two Vercel addresses.

#### R2 — Make the www redirect permanent (owner, 1 minute)
Vercel → project `exams` → Settings → Domains → card `www.exams.ro` → change "307 Temporary Redirect"
to "308 Permanent Redirect" → Save. Verify: `curl -sI https://www.exams.ro/ | head -1` shows 308.

#### R3 — Email on exams.ro (owner decision)
Before the cutover the zone had `MX 0 mail.exams.ro` plus `mail`, `ftp`, `cpanel`, `webmail`,
`autodiscover` A records, all pointing at the old host. They were removed during the H10 edit, so
email addressed to `@exams.ro` has been undeliverable since 2026-09-07. Decide:
- Email was not used → nothing to do.
- Email is needed → either recreate `MX 0 mail.exams.ro` and `A mail.exams.ro 81.181.252.2` (DNS only)
  until R4, then move the mailbox to another provider before cancelling the host; or set up a new
  provider now and add its MX/TXT records. Do not cancel the old hosting (R4) before this is settled.

#### R4 — Cancel the old hosting (owner, after R3)
Cancel the gazduire.ro account `examscb`. Nothing else references it. Keep the export folder forever.
Verify afterwards that https://exams.ro and https://files.exams.ro still work (they do not depend on it).

#### R5 — Real R2 credentials on Vercel (owner or agent, needed before v2 only)
What it is: the four variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET` exist on Vercel (Preview + Production, sensitive) but were entered in the first setup
batch together with two values that turned out to be placeholders, so they are presumed placeholders
too; they cannot be read back. v1 never uses them: the site only builds links from
`R2_PUBLIC_BASE_URL`, and the seed ran locally from `.env.local`. v2 (uploads) will run server code on
Vercel that signs browser uploads and generates thumbnails, and that code reads these four at runtime.
How: the real values are in `.env.local` on Bogdan's Mac. Either paste them in Vercel → Settings →
Environment Variables (edit each, Production and Preview, keep "sensitive"), or let an agent do it:
```
cd ~/repos/personal/exams
for N in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET; do
  V=$(grep "^$N=" .env.local | cut -d= -f2- | tr -d '"')
  for E in production preview; do
    npx --yes vercel@latest env rm "$N" "$E" --yes --scope aptabase
    printf '%s' "$V" | npx --yes vercel@latest env add "$N" "$E" --scope aptabase
  done
done
```
(`--no-sensitive` is only for `NEXT_PUBLIC_*`; secrets stay sensitive.) Verify by deploying a
temporary route that runs the same HeadBucket check as `scripts/r2-check.ts` and returns ok/fail
without printing values, then remove it. Never print these values in logs or chat. Also delete
`EXPORT_DIR` from Vercel; it is local-only.

#### R6 — Mobile performance score on a subject page (agent)
The one Stage 3 acceptance item never measured: Lighthouse performance ≥ 90, mobile, on a subject
page with images, e.g. https://exams.ro/an/2/teoria-sistemelor/224. Google's anonymous PageSpeed
quota rejected two attempts on 2026-09-07; retry on another day:
```
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fexams.ro%2Fan%2F2%2Fteoria-sistemelor%2F224&strategy=mobile&category=performance" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);r=d['lighthouseResult'];print(round(r['categories']['performance']['score']*100));[print(k,r['audits'][k]['displayValue']) for k in ['largest-contentful-paint','total-blocking-time','cumulative-layout-shift']]"
```
Or a Chrome performance trace from a network where `files.exams.ro` resolves (Bogdan's router
does not; see gotchas). If below 90, the likely levers are: the lightbox and search JavaScript
(load them only when needed with `next/dynamic`), thumbnail sizes (400 px WebP already), and font
loading (Silkscreen is used only for the mark). Record the score in PROGRESS.md.

#### R7 — Final docs and memory (agent, after R1–R4)
README: replace the Vercel URL with https://exams.ro. PROGRESS.md: mark Stage 6 done. Memory notes
under `~/.claude/projects/-Users-bogdan-ivanov-repos-personal/memory/` (`exams-ro-rebuild.md`,
`exams-deploy-gotchas.md`): update the state line.

#### R8 — v2: uploads (not started; owner must green-light)
Prerequisites: R5, and an auth choice (Auth.js with Google/GitHub, or Clerk). Design in section 11
"v2 outline". Reminders that came out of v1: the schema already has nullable `legacy_id` for new
rows, `lost_files`, and a reserved `search` tsvector column; the search index is a `force-static`
route that must switch to `revalidate` once content changes after build; browser uploads must go
straight to R2 with signed URLs (Vercel functions cap request bodies at 4.5 MB).

### Gotchas a new agent will hit (all verified in this project)
- Bogdan's home router DNS (192.168.0.1) sinkholes `*.r2.dev` to 127.0.0.1 and answered the apex
  `exams.ro` with an empty result for a while after the cutover. Public resolvers are fine. Verify
  with `dig @1.1.1.1` and `curl --resolve host:443:<ip>`; suggest setting the Mac's DNS to 1.1.1.1.
- Vercel env vars added in the dashboard are "sensitive": `vercel env pull` writes `[SENSITIVE]`, and
  blank values fail builds with "Missing environment variable". `NEXT_PUBLIC_*` variables must be added
  with `--no-sensitive`. `vercel link` overwrites `.env.local` (re-add `EXPORT_DIR` afterwards).
- Use `npx --yes vercel@latest` inside a shell function; `pnpm dlx vercel` dies in pnpm's package
  scanner on slow links, and zsh does not word-split `$VAR` holding a command or options
  (`--resolve` must be passed as an array or literally).
- Heredocs that contain backticks must be quoted (`<<'EOF'`), or the shell executes the code spans.
- pnpm 11 needs `allowBuilds` in `pnpm-workspace.yaml` (esbuild is already listed); Next 16 needs
  `next typegen` before `tsc` (the `typecheck` script does it).
- Build-time DB access goes through `src/lib/db.ts`, which retries transient fetch errors; keep it
  that way, 1,515 pages are generated per build.
- Never run the seed's media phase with more than 3 workers on the Mac; six got OOM-killed.

---

## 1. Goal and scope

Rebuild https://exams.ro as a modern, responsive, read-only site that shows the exam-subject
archive of Politehnica București, Facultatea de Automatică și Calculatoare. The site must be
free to run, deploy from a public GitHub repo on Vercel Hobby, and be structured so that
**v2 (logged-in users creating subjects and uploading files)** is an addition, not a rewrite.

In scope for v1: browse by year and course, subject pages with attachments, search, the
three-colour arrows brand mark, deployment on the exams.ro domain.

Out of scope for v1: login, uploads, comments, moderation, admin UI, old-URL redirects, RSS.

---

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Framework | Next.js, App Router, TypeScript, current stable major. No canary. |
| Styling | Tailwind CSS v4. |
| Database | Neon Postgres (free tier) created through the Vercel Marketplace integration. |
| ORM | Drizzle ORM with drizzle-kit migrations. |
| Files | Cloudflare R2 bucket, public read through custom domain `files.exams.ro`, listing disabled. |
| Hosting | Vercel Hobby, Git integration, GitHub repo is **public**. |
| Data in repo | **None.** No dump, no JSON, no images. Only code, schema, migrations, scripts. |
| Content kept | Only subjects whose institution is Politehnica București and faculty is Automatică și Calculatoare, **including the Master AC courses**. Everything else is dropped. |
| Schema | No institution table, no faculty table. Tables: `course`, `subject`, `attachment`. |
| Search v1 | Browser-side search over a JSON index generated at build time (MiniSearch). |
| Design | New design. The only element preserved is the three-colour arrows mark around the EXAMS.RO wordmark, redrawn as SVG, with its teal / green / orange palette. |
| Old links | Not preserved. No redirects. |
| Personal data | The old `user` table is not imported. Poster name is shown only when the subject was not posted anonymously. |
| Package manager | pnpm. Node 22 LTS. |

---

## 3. HUMAN actions and accounts (historical; current status is in section 0)

Agents cannot log into dashboards, accept terms, add payment methods or change DNS.
The table lists every such step, when it is needed, and what the human hands back to the agent.

| # | Action | Needed before | Output handed to the agent |
|---|---|---|---|
| H1 | Confirm the local machine has Node 22 LTS and pnpm, or allow the agent to install them. | Stage 0 | nothing |
| H2 | **GitHub**: use the existing public repo `ivnbogdan/exams` (contents replaced) (no README, no license, no gitignore) under the desired owner. If `gh auth status` on the machine is logged in with rights on that owner, the agent may create it instead. | Stage 0 | repo URL |
| H3 | **Vercel**: confirm the team is on the Hobby plan (Settings → Billing). Import the GitHub repo as a new project (Add New → Project). Framework preset Next.js, defaults otherwise. Let the first deploy fail if env vars are missing; that is expected. | Stage 6, but doing it right after H2 is fine | project name |
| H4 | **Neon via Vercel**: in the Vercel project, Storage → Create Database → Neon → Free plan → connect to the project (all environments). Vercel injects `DATABASE_URL` and related vars. | Stage 1 | `DATABASE_URL` (copy from Vercel → Settings → Environment Variables, or run `vercel env pull .env.local` after H8) |
| H5 | **Cloudflare account** and add the zone `exams.ro` on the Free plan. Cloudflare shows two nameservers. | Stage 2 for R2, cutover for DNS | nameserver names |
| H6 | ~~Registrar nameserver change~~ Not needed, see H5. Original text: change the nameservers of exams.ro to the two Cloudflare nameservers. Before doing this, note any existing DNS records at the old host (especially MX records if email on exams.ro is in use) and recreate them in Cloudflare DNS. Propagation takes up to 24 h. The old site keeps working during this time as long as the A record still points to the old host. | Cutover (Stage 6). Can be done early; it does not affect the old site. | confirmation |
| H7 | **Cloudflare R2**: enable R2 (Cloudflare asks for a payment method even though the free tier is 0 €). Create bucket `exams-ro-files`, location Automatic or EU. In the bucket: Settings → Public access → Custom Domains → add `files.exams.ro` (works once H5 is done). Until H6 has propagated, also enable the "Public Development URL" (r2.dev) as a temporary base URL. Then R2 → Manage R2 API Tokens → Create token, permission **Object Read & Write**, scoped to this bucket. | Stage 2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=exams-ro-files`, `R2_PUBLIC_BASE_URL` (`https://files.exams.ro` or the temporary r2.dev URL) |
| H8 | **Vercel CLI login on the machine**: run `vercel login` (interactive), then in the repo folder `vercel link` and pick the project. Optional but makes `vercel env pull` possible. | Stage 1 | linked project |
| H9 | Put the values from H4 and H7 into `.env.local` in the repo (agent can do this if the values are pasted into the chat), and into Vercel → Settings → Environment Variables for Production and Preview (`vercel env add` works after H8). | Stage 2 locally, Stage 6 on Vercel | nothing |
| H10 | **Domain on Vercel**: Vercel project → Settings → Domains → add `exams.ro` and `www.exams.ro`. Vercel displays the DNS records it wants. Add them in Cloudflare DNS with the proxy **off** (grey cloud, "DNS only"). Remove the old A record that points to the old host. | Cutover | nothing |
| H11 | Verify the site on the real domain, then cancel the old hosting at gazduire.ro when convenient. Keep the export folder as the permanent backup of the original data. | After cutover | nothing |

Everything not listed above is agent work.

---

## 4. Source data contract

The export lives on the owner's machine at `~/repos/personal/exams-ro-export/`. It is **never**
copied into the repo. The seed script reads it from the path in `EXPORT_DIR`.

| Path | Content |
|---|---|
| `subjects_with_attachments.json` | Array of 713 subjects. Fields below. |
| `tables/materie.json` | Course rows: `id`, `id_parinte` (faculty id), `nume`, `an` (study year "1".."4"). |
| `tables/facultate.json` | Faculty rows: `id`, `nume`, `id_parinte`. Used only to filter courses. |
| `files/<subjectId>/<filename>` | The attachment files, 681 in total. |
| `attachments.csv` | One row per attachment record, includes the 5 files that have no DB row (`status = on_disk_no_db_row`). |
| `brand/arrows_banner.png` | The three-colour arrows mark, 250×122 px. Redraw as SVG. |
| `brand/COLOURS.md` | Colour values. |
| `examscb_main.sql` | Raw dump. Do not use it; the JSON is the cleaned source. |

Subject fields in the JSON: `id`, `profesor`, `materie` (course name, free text but matches a
course row case- and diacritic-insensitively for every kept subject), `data` (posting date,
YYYY-MM-DD), `content` (HTML-ish text, mostly `<br>`), `user` (poster display name), `serie`,
`grupa`, `facultate`, `institutie`, `data_an` (exam year), `sesiune`, `uid` (Facebook id, do
not import), `anonim` ("1" = posted anonymously), `attachments[]`.

Attachment fields: `db_name` (`<subjectId>/<original name>`), `local_path` (relative to the
export folder, null when missing), `status` one of `present`, `present_renamed`,
`missing_on_server`, and `size`.

Expected counts after filtering (acceptance numbers for Stage 2):

| Metric | Value |
|---|---|
| Subjects kept | 708 |
| Courses used | 88 (80 licență, 8 master) |
| Courses by study year | year 1: 20, year 2: 19, year 3: 21, year 4: 28 |
| Attachment records on kept subjects | 877, of which 675 present and 202 missing |
| Extra on-disk files without a DB row | 5 (all belong to kept subjects, import them) |
| Files to upload | 680, about 656 MB |
| Of which images | 400 (395 with a DB row + 5 extra) |
| Hidden stub subjects | 45 (no present file and under 80 characters of text) |
| Visible subjects | 663 |
| Session values | Prima sesiune 586, Sesiunea de restante 61, Partial 46, Favorite 15 |
| Exam years | 2004 to 2017 |
| Anonymous subjects | 408 of 708 |

---

## 5. Data model (Drizzle, Postgres)

```
course
  id            serial PK
  legacy_id     integer unique            -- materie.id from the export
  name          text not null
  slug          text not null unique      -- ascii, lowercase, hyphens
  year          smallint not null         -- 1..4 for licență, 1..2 for master
  level         text not null             -- 'licenta' | 'master'
  created_at    timestamptz default now()

subject
  id            serial PK
  legacy_id     integer unique            -- subiect.id from the export
  course_id     integer not null FK course.id
  professor     text                      -- normalised, nullable when '-' or empty
  exam_year     smallint                  -- data_an
  exam_date     date                      -- only when content states one; else null
  session       text not null             -- 'prima' | 'restante' | 'partial' | 'altele'
  series        text                      -- serie, nullable
  group_name    text                      -- grupa, nullable
  content_html  text not null             -- sanitised HTML
  content_text  text not null             -- plain text, for search and snippets
  poster_name   text                      -- null when anonim = 1
  hidden        boolean not null default false
  created_at    timestamptz not null      -- 'data' from the export
  updated_at    timestamptz not null default now()
  search        tsvector generated always as (...) stored   -- reserved for v2 server search
  index on (course_id, exam_year desc), index on (hidden, created_at desc)

attachment
  id            serial PK
  subject_id    integer not null FK subject.id on delete cascade
  original_name text not null             -- for Content-Disposition on download
  storage_key   text not null unique      -- original file in R2
  web_key       text                      -- images only: max 2000 px WebP
  thumb_key     text                      -- images only: 400 px WebP
  mime          text not null
  size          integer not null
  width         integer                   -- images only, after EXIF rotation
  height        integer
  kind          text not null             -- 'image' | 'pdf' | 'doc' | 'archive' | 'text' | 'other'
  sort_order    smallint not null default 0
  created_at    timestamptz default now()
```

The `search` column exists so that v2 can switch to Postgres full-text search with a query
change only. Populate it with `to_tsvector('simple', unaccent(...))` if the `unaccent`
extension is available, otherwise `'simple'` alone. Do not build any v1 feature on it.

---

## 6. Import and media rules (Stage 2)

1. **Filter.** Keep a subject when `institutie` contains "politehnica" and `facultate`
   contains "automatica", both compared after lowercasing and stripping diacritics.
   Courses are the `materie` rows whose `id_parinte` is a faculty whose name contains
   "automatica"; level is `master` when that faculty name contains "master".
2. **Course match.** Match `subject.materie` to a course by the same normalisation. Fail
   loudly if any kept subject does not match; the expected miss count is zero.
3. **Professor.** Trim, collapse spaces, title-case each word, keep hyphenated names.
   Store null when the value is empty or `-`.
4. **Session mapping.** "Prima sesiune" → `prima`, "Sesiunea de restante" → `restante`,
   "Partial" → `partial`, anything else including "Favorite" → `altele`.
5. **Content.** Convert `\r\n` and `\n` to `<br>`, then sanitise with an allow-list:
   `br, a[href^=http], b, strong, i, em, sub, sup, pre`. Everything else, including
   `<toy>`, is stripped. Store the result in `content_html`. Derive `content_text` by
   replacing `<br>` with newlines, stripping tags and decoding entities.
6. **Anonymous.** When `anonim` is "1", `poster_name` is null. Never import `uid`.
7. **Hidden.** `hidden = true` when the subject has no present attachment and
   `content_text` has fewer than 80 characters. Expect 45.
8. **Attachments.** Import records with status `present` or `present_renamed`, plus the 5
   `on_disk_no_db_row` rows from `attachments.csv`. Skip `missing_on_server` entirely.
   `original_name` is the filename part of `db_name` when present, else the disk name.
   `sort_order` follows the order in the export.
9. **Kind** from extension: jpg/jpeg/png/gif/bmp → image; pdf → pdf; doc/docx/xls/xlsx → doc;
   rar/zip/001-014 → archive; txt → text; else other.
10. **Storage keys.** `subjects/<subject.legacy_id>/<attachment.id>-<slug(original name)>.<ext>`
    for the original; same prefix with `-web.webp` and `-thumb.webp` for derivatives.
    Keys must be ASCII. The original filename with `&`, `+`, quotes or diacritics is kept
    only in `original_name`.
11. **Images.** Use sharp. Call `.rotate()` first so EXIF orientation from phone photos is
    applied. Web version: fit inside 2000×2000, WebP quality 80. Thumbnail: fit inside
    400×400, WebP quality 75. Record `width` and `height` of the rotated original.
    Upload original, web and thumb. Non-image files: upload the original only.
12. **Upload.** S3 API against `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` with
    `@aws-sdk/client-s3`, region `auto`. Set `ContentType`. For downloads of non-images set
    `ContentDisposition: attachment; filename="<original_name>"` on the object.
13. **Idempotent.** The seed is re-runnable: skip uploads whose key exists with the same
    size, upsert DB rows by `legacy_id`. Provide `--dry-run` (counts only, no writes) and
    `--only-db` / `--only-media` flags. Log a summary table at the end.
14. **Never** write the export, `.env.local`, or any generated data into git. The
    `.gitignore` must contain `.env*`, `/data`, `*.sql`, `/export`.

---

## 7. Routes and rendering (Stage 3)

| Route | Content | Generation |
|---|---|---|
| `/` | Arrows hero, search box, browse tiles (An I–IV, Master), latest 12 visible subjects, a stats line (663 subjects, 88 courses, 680 files) | static |
| `/an/[1-4]` and `/master` | Courses of that year/level with subject counts | static |
| `/an/[year]/[course]` and `/master/[course]` | Course page: subjects grouped by exam year desc, then session order prima, restante, partial, altele, then date. The course must belong to that year/level, else 404. | static, `generateStaticParams` |
| `/an/[year]/[course]/[id]` and `/master/[course]/[id]` | Subject page: course, professor, year, session, series and group, poster name or "anonim", content, lost-files note, attachments: image gallery with lightbox, download list for other kinds. `id` is `legacy_id`; the subject must belong to that course, else 404. Hidden subjects 404. | static, `generateStaticParams` over visible subjects |
| `/curs/[slug]`, `/subiect/[id]` | Former flat addresses: permanent redirects to the hierarchical URLs, generated at build | static |
| `/cauta` | Search page, reads `?q=` | static shell, client component |
| `/search-index.json` | Route handler exporting the index. `export const dynamic = 'force-static'` in v1. | static at build |
| `/sitemap.xml`, `/robots.txt` | Visible subjects and courses only | static |

Rules:
- Database access only in server components, route handlers and scripts. Use the Neon
  serverless driver. Keep all queries in `src/lib/queries.ts`.
- Images from R2 are rendered with plain `<img>` tags using the `web` and `thumb` keys, with
  `width`/`height` from the DB and `loading="lazy"`. Do **not** route them through
  `next/image` optimisation; Hobby has a small optimisation quota and the derivatives already
  exist.
- Downloads link straight to `R2_PUBLIC_BASE_URL/<storage_key>`.
- Lightbox: `yet-another-react-lightbox` with the Zoom plugin, or a minimal custom dialog
  if the dependency causes trouble. Keyboard navigation and Escape must work.
- Every internal link is built with `src/lib/urls.ts` (`levelUrl`, `courseUrl`, `subjectUrl`). Never hand-write these paths.
- Site metadata: title pattern `<course> · <year> · exams.ro`, description from the first
  160 characters of `content_text`, Open Graph image is the arrows mark.

---

## 8. Search v1 (Stage 4)

Index built by the `/search-index.json` route from the DB at build time. Visible subjects
only. One document per subject:

```
{ id, course, courseSlug, year (exam_year), session, series, group, professor,
  text (content_text, capped at 3000 chars), date (created_at, YYYY-MM-DD) }
```

Budget: under 600 KB raw, under 200 KB gzipped. Fetch it lazily on the first keystroke or
on `/cauta` load, cache it in memory for the session.

Client library: MiniSearch. Configuration:
- `fields: ['course','professor','text','session','series','group','year']`,
  `storeFields` for everything shown in results.
- `searchOptions: { prefix: true, fuzzy: 0.2, boost: { course: 4, professor: 3, group: 2, series: 2, session: 2, text: 1 }, combineWith: 'AND' }`, fall back to `OR` when AND returns nothing.
- `processTerm`: lowercase, Unicode NFKD, strip combining marks (this folds ă â î ș ş ț ţ),
  strip punctuation, drop terms shorter than 2 characters. Apply the same function to the
  query. Session labels are indexed in Romanian ("prima sesiune", "restanțe", "parțial").
- Query hints, applied before searching: a 4-digit token between 2004 and 2030 becomes an
  exam-year filter; tokens matching `^\d{3}[A-Za-z]{1,2}$` (e.g. 321CA) match `group`;
  "restante", "partial", "prima" map to the session filter.
- Facets rendered from the current result set: course, exam year, session, professor.
  Clicking a facet adds a filter; filters are reflected in the URL query string.
- Result item: course name (link), professor, exam year and session, group, then a snippet
  of `text` around the first matching term with the term highlighted. 20 results per page.
- Header search box: debounced 150 ms, shows the top 6 results in a dropdown, Enter goes
  to `/cauta?q=`.
- Empty query on `/cauta` shows the facets only.

---

## 9. Design (Stage 5)

- **Arrows mark.** Redraw `brand/arrows_banner.png` as an SVG: dark rounded rectangle,
  white pixel-style EXAMS.RO wordmark (a bold geometric sans is acceptable), three chunky
  arrows pointing inward: teal top-left, green bottom-left, orange bottom-right. Export as
  `public/brand/arrows.svg`, plus a square favicon variant and a 1200×630 Open Graph PNG.
- **Palette.** teal `#24909d`, green `#6ab824`, orange `#ed9d13`, ink `#202020`, paper
  `#f6f6f6`, page background `#dde3eb` lightened to taste. Use teal for professor, green for
  course, orange for date labels, as the old cards did. Red `#e32c3b` only for errors.
- **Type.** Inter or system sans for body. Optional: Yanone Kaffeesatz from Google Fonts
  via `next/font` for headings, since the old site used it.
- **Layout.** Mobile first, max content width 72rem, cards for subjects, a sticky header
  with the mark and the search box. Support dark mode with the same accents.
- **Accessibility.** Visible focus rings, alt text on images ("Subiect <course> <year>,
  imaginea N"), colour contrast AA, lightbox keyboard support.

---

## 10. Environment variables

| Name | Where | Notes |
|---|---|---|
| `DATABASE_URL` | Vercel (from Neon integration) and `.env.local` | pooled connection string |
| `R2_ACCOUNT_ID` | Vercel and `.env.local` | |
| `R2_ACCESS_KEY_ID` | seed only, `.env.local`; also Vercel for v2 | |
| `R2_SECRET_ACCESS_KEY` | seed only, `.env.local`; also Vercel for v2 | |
| `R2_BUCKET` | both | `exams-ro-files` |
| `R2_PUBLIC_BASE_URL` | both | `https://files.exams.ro`, temporary r2.dev URL until DNS is live |
| `NEXT_PUBLIC_SITE_URL` | both | `https://exams.ro` |
| `EXPORT_DIR` | `.env.local` only | absolute path to the export folder |

Commit `.env.example` with names and placeholder values only.

---

## 11. Stages and acceptance criteria

### ✅ Stage 0 — Repository skeleton (agent; needs H1, H2)
- Scaffold Next.js with TypeScript, Tailwind v4, ESLint, App Router, `src/` dir, pnpm.
  If `create-next-app` refuses the non-empty folder, scaffold in a temp dir and move files in.
- Add `.gitignore` rules from section 6.14, `.env.example`, `README.md` with local setup,
  `CLAUDE.md` with: data model summary, "content is generated by the seed, never edited by
  hand", the env var list, and the commands below.
- `docs/VERSIONS.md` recording the exact versions installed.
- Scripts in `package.json`: `dev`, `build`, `lint`, `typecheck`, `db:generate`,
  `db:migrate`, `db:studio`, `seed`.
- First commit and push.
- **Accept:** `pnpm lint`, `pnpm typecheck`, `pnpm build` pass on a fresh clone with only
  `.env.example` copied to `.env.local` and a dummy `DATABASE_URL` (build must not need the
  DB yet).

### ✅ Stage 1 — Schema and migrations (agent; needs H4)
- Drizzle schema from section 5, first migration generated and applied to Neon.
- `src/lib/db.ts` with the Neon serverless driver, `src/lib/queries.ts` stubs.
- **Accept:** `pnpm db:migrate` succeeds; `drizzle-kit` reports no drift; the three tables
  exist with the indexes.

### ✅ Stage 2 — Seed and media pipeline (agent; needs H7, H9 locally)
- `scripts/seed.ts` implementing section 6, run with `tsx`.
- **Accept:** `pnpm seed --dry-run` prints exactly the numbers in section 4. A full run
  ends with: 88 courses, 708 subjects (45 hidden), 680 attachments, 400 image derivative
  pairs, and R2 object count = 680 + 2×400 = 1480. Re-running is a no-op. Ten random
  attachments open correctly from `R2_PUBLIC_BASE_URL`, including one whose original name
  contained `&` and one with diacritics. One phone photo that is rotated in EXIF renders
  upright.

### ✅ Stage 3 — Pages (agent)
- Routes from section 7 with placeholder styling.
- **Accept:** `pnpm build` generates 663 subject pages and 88 course pages; `/subiect/<id>`
  for a hidden subject returns 404; a subject with 10 attachments shows a gallery and a
  download list; Lighthouse performance on a subject page ≥ 90 on mobile emulation.

### ✅ Stage 4 — Search (agent)
- Section 8.
- **Accept:** `/search-index.json` is under budget; queries "protocoale", "sinteza
  elementara", "tapus 2015", "321CA", "restante analiza" each return sensible top results;
  a typo like "algoritmi paraleli distribuit" still finds the course; facets filter and are
  reflected in the URL.

### ✅ Stage 5 — Design (agent)
- Section 9 applied across all pages.
- **Accept:** screenshots at 375, 768 and 1280 px width committed to `docs/screenshots/`;
  axe or Lighthouse accessibility ≥ 95; dark mode checked; the arrows SVG is crisp at 2×.

### Stage 6 — Deployment and cutover (production on Vercel done; domain steps in section 0)
- Production env vars present; a Preview deployment from a PR builds green; Production
  deploy from `main` serves the site on the `*.vercel.app` URL.
- After H10: `https://exams.ro` and `https://www.exams.ro` serve the site with valid TLS,
  `files.exams.ro` serves an attachment, `R2_PUBLIC_BASE_URL` switched from r2.dev to the
  custom domain and redeployed.
- **Accept:** all of the above verified with `curl -I`, plus a manual pass over 5 subject
  pages and 3 downloads on the live domain.

### v2 outline (not to be built now)
Auth (Auth.js with Google/GitHub, or Clerk). A `create subject` server action writing
`subject` and `attachment` rows with `poster_name` from the session. Browser-direct upload to
R2 via presigned PUT URLs (Vercel functions cap request bodies at 4.5 MB), with the
derivatives generated by a follow-up server action or a small queue. `revalidatePath` for the
course page, subject page, home and `/search-index.json` (switch that route from
`force-static` to `revalidate`). Possibly move search to the reserved `search` column.

---

## 12. Commands reference

```
pnpm install
cp .env.example .env.local        # then fill values
pnpm db:generate                  # drizzle-kit generate
pnpm db:migrate                   # apply migrations to Neon
pnpm seed --dry-run               # counts only
pnpm seed                         # full import + upload
pnpm dev                          # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm build
```

---

## 13. Risks and gotchas

- **XSS.** Old content is user-written HTML. Only render `content_html` after the
  sanitiser in section 6.5; never render the raw export string.
- **EXIF rotation.** Many attachments are phone photos stored sideways with an orientation
  tag. Sharp `.rotate()` before resizing is mandatory.
- **Filenames.** Originals contain `&`, `+`, `'`, spaces and Romanian letters. Storage keys
  must be generated, never derived directly from the original name.
- **R2 custom domain** requires the exams.ro zone to be on Cloudflare (H5, H6). Until then use
  the r2.dev URL, which is rate-limited and not meant for production.
- **Cloudflare proxy in front of Vercel** causes TLS and caching problems; DNS records for
  Vercel must be "DNS only".
- **Neon free tier** sleeps when idle. v1 does not query it at request time, so visitors never
  see the wake-up. Keep it that way; any request-time DB access is a v2 decision.
- **Vercel Hobby** is for non-commercial use, which exams.ro is. Do not add ads.
- **Email on exams.ro.** If the old host serves email for the domain, H6 must recreate MX
  and related records or mail stops.
- **Do not** import `user`, `user_online`, `comentarii`, `uid`, or Facebook ids.
