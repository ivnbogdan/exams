# exams.ro rebuild — what only you can do

Updated 2026-09-07 after checking live DNS. The site is live at https://exams-sooty.vercel.app.
`exams.ro` is already on Cloudflare nameservers in your account, with an A record to the old host
81.181.252.2. So the cutover is two record edits, no nameserver change. Do the steps in order and tell the
agent after each one; it then runs its matching step.

## Done
- [x] H1 Node and pnpm on the machine
- [x] H2 GitHub repo `ivnbogdan/exams`
- [x] H3 Vercel project `exams` in team `aptabase`
- [x] H4 Neon database through Vercel
- [x] H5 Cloudflare zone for exams.ro (already existed)
- [x] H6 Nameservers on Cloudflare (already the case)
- [x] H7 Cloudflare R2 bucket `exams-ro-files`, API token, r2.dev development URL
- [x] H8 `vercel login` and `vercel link`
- [x] H9 values in `.env.local` and on Vercel

## Remaining, in order

- [x] **H7b Files domain (done 2026-09-07; A1 done, files served from files.exams.ro).** Cloudflare → R2 → `exams-ro-files` → Settings → Public access → Custom Domains → Connect domain → `files.exams.ro`. Cloudflare creates the DNS record. Wait for "Active". → tell the agent: it runs **A1**.
- [x] **H10 Site domain (done 2026-09-07; apex is primary, www redirects to it).** Leftovers: delete the two `NS` records for `exams.ro` that point at `ns1/ns2.vercel-dns.com` in Cloudflare DNS (Cloudflare ignores them at the apex, they only confuse), and change the `www` redirect in Vercel from 307 to 308. Original text: Vercel → project `exams` → Settings → Domains → add `exams.ro` and `www.exams.ro`. Then in Cloudflare → DNS → Records: edit `A exams.ro` from `81.181.252.2` to the A value on Vercel's domain card (`76.76.21.21` unless the card shows another); edit `www` from `CNAME exams.ro` to the CNAME target the card shows for `www.exams.ro` (project-specific, like `xxxx.vercel-dns-0xx.com`); keep the cloud grey (DNS only) on both. Leave every other record alone. Wait for "Valid Configuration" in Vercel. → tell the agent: it runs **A2** and **A3**.
- [ ] **Email decision.** Note: the MX and `mail` records disappeared from Cloudflare during the H10 edit, so email on exams.ro is already off; if it was in use, recreate them or move email now. the MX record points at `mail.exams.ro`, which resolves to the old host (81.181.252.2), as do `ftp`, `cpanel`, `webmail` and `autodiscover`. If anyone still receives email at an exams.ro address, that mailbox dies with the old hosting; move or drop the email before H11. If email is not used, leave those records alone until H11 and delete them then.
- [ ] **H11 Old hosting.** Once the agent reports A3 green and the email question is settled, cancel the gazduire.ro hosting; delete the dead `mail`, `ftp`, `cpanel`, `webmail`, `autodiscover` and MX records if email is unused. Keep `~/repos/personal/exams-ro-export/` forever; it is the only copy of the original data.
- [ ] **H12 Before v2 only.** On Vercel, replace the placeholder `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` with the real values (v1 never reads them), and delete `EXPORT_DIR`.

Shortcut: a Cloudflare API token with Zone → DNS → Edit on `exams.ro`, given to the agent, lets it do
the record edits in H7b and H10 and verify them. Adding the domain in Vercel stays yours.

Monthly cost when done: 0.
