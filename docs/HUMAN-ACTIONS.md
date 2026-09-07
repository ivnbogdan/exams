# exams.ro rebuild — what only you can do

Updated 2026-09-07. The site is live at https://exams-sooty.vercel.app. Everything below is about
moving it to exams.ro; the agents cannot touch DNS, registrars or your Cloudflare and Vercel accounts.
Do the steps in order. After each one, tell the agent, which then runs its matching step (A1, A2, A3).

## Done
- [x] H1 Node and pnpm on the machine
- [x] H2 GitHub repo `ivnbogdan/exams`
- [x] H3 Vercel project `exams` in team `aptabase`
- [x] H4 Neon database through Vercel
- [x] H7 Cloudflare R2 bucket `exams-ro-files`, API token, r2.dev development URL
- [x] H8 `vercel login` and `vercel link`
- [x] H9 values in `.env.local` and on Vercel

## Remaining, in order

- [ ] **H5 Cloudflare zone.** Create a Cloudflare account if you don't have one. Add a site → `exams.ro` → Free plan. Note the two nameservers it shows.
- [ ] **H6 Nameservers.** Before switching: in the old host's DNS panel, write down every record, especially MX if you use email on exams.ro, and recreate them in Cloudflare DNS. Then at your registrar replace the nameservers with the two from Cloudflare. Propagation takes up to a day; the old site keeps working meanwhile.
- [ ] **H7b Files domain.** Cloudflare → R2 → `exams-ro-files` → Settings → Public access → Custom Domains → Connect domain → `files.exams.ro`. Cloudflare creates the DNS record. Wait for "Active". → tell the agent: it runs **A1**.
- [ ] **H10 Site domain.** Vercel → project `exams` → Settings → Domains → add `exams.ro` and `www.exams.ro`. Put the records Vercel shows into Cloudflare DNS with the orange cloud turned OFF (DNS only). Delete the old A record for the old host. Wait for "Valid Configuration". → tell the agent: it runs **A2** and **A3**.
- [ ] **H11 Old hosting.** Once the agent reports A3 green, cancel the gazduire.ro hosting. Keep `~/repos/personal/exams-ro-export/` forever; it is the only copy of the original data.
- [ ] **H12 Before v2 only.** On Vercel, replace the placeholder `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` with the real values (v1 never reads them), and delete `EXPORT_DIR`.

Monthly cost when done: 0.
