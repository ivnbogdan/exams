# exams.ro rebuild — what only you can do

Updated 2026-09-07 evening. The site is live at https://exams.ro. Full details for every item are in
`docs/PLAN.md` section 0 (steps R1–R8), including verification commands for the agents.

## Done
H1 machine · H2 GitHub repo · H3 Vercel project · H4 Neon · H5/H6 Cloudflare zone and nameservers (pre-existing) ·
H7 R2 bucket and token · H7b `files.exams.ro` · H8 Vercel CLI login · H9 env values · H10 domain on Vercel (apex primary).

## Remaining
- [ ] **R1** Cloudflare DNS: delete the two `NS exams.ro → ns1/ns2.vercel-dns.com` records. Keep everything else.
- [ ] **R2** Vercel → Domains → `www.exams.ro`: change the redirect from 307 to 308.
- [ ] **R3** Email: the MX and `mail` records were removed during the cutover, so `@exams.ro` mail is off. Decide: not needed (nothing to do) or recreate/move it before R4.
- [ ] **R4** After R3: cancel the gazduire.ro hosting. Keep `~/repos/personal/exams-ro-export/` forever.
- [ ] **R5** Before v2 only: real `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` on Vercel (values are in `.env.local`); an agent can do it with the command in PLAN.md R5. Delete `EXPORT_DIR` there.
- [ ] **R8** When you want uploads: pick the auth provider and tell an agent to start v2 (PLAN.md section 11).

Agent-only leftovers (no action from you): R6 mobile performance score, R7 final docs.

Tip for your own machine: your router's DNS blocks `r2.dev` and lagged on the new records; putting
`1.1.1.1` first in the Mac's DNS settings fixes both.

Monthly cost: 0.
