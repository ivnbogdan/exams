# exams.ro rebuild — what only you can do

Updated 2026-09-07 after checking live DNS. The site is live at https://exams-sooty.vercel.app.
 is already on Cloudflare nameservers in your account, with an A record to the old host
81.181.252.2. So the cutover is two record edits, no nameserver change. Do the steps in order and tell the
agent after each one; it then runs its matching step.

## Done
- [x] H1 Node and pnpm on the machine
- [x] H2 GitHub repo 
- [x] H3 Vercel project  in team 
- [x] H4 Neon database through Vercel
- [x] H5 Cloudflare zone for exams.ro (already existed)
- [x] H6 Nameservers on Cloudflare (already the case)
- [x] H7 Cloudflare R2 bucket , API token, r2.dev development URL
- [x] H8  and 
- [x] H9 values in  and on Vercel

## Remaining, in order

- [ ] **H7b Files domain.** Cloudflare → R2 →  → Settings → Public access → Custom Domains → Connect domain → . Cloudflare creates the DNS record. Wait for "Active". → tell the agent: it runs **A1**.
- [ ] **H10 Site domain.** Vercel → project  → Settings → Domains → add  and . Then in Cloudflare → DNS → Records: edit  from  to the IP Vercel shows (currently ); edit  from  to ; keep the cloud grey (DNS only) on both. Leave every other record alone. Wait for "Valid Configuration" in Vercel. → tell the agent: it runs **A2** and **A3**.
- [ ] **Email decision.** the MX record points at , which resolves to the old host (81.181.252.2). If anyone still receives email at an exams.ro address, that mailbox dies with the old hosting; move or drop the email before H11. If email is not used, leave the MX and mail records alone until H11 and delete them then.
- [ ] **H11 Old hosting.** Once the agent reports A3 green and the email question is settled, cancel the gazduire.ro hosting; delete the dead /MX records if email is unused. Keep  forever; it is the only copy of the original data.
- [ ] **H12 Before v2 only.** On Vercel, replace the placeholder , , ,  with the real values (v1 never reads them), and delete .

Shortcut: a Cloudflare API token with Zone → DNS → Edit on , given to the agent, lets it do
the record edits in H7b and H10 and verify them. Adding the domain in Vercel stays yours.

Monthly cost when done: 0.
