# exams.ro rebuild — what only you can do

Everything else is done by the agents. Tick these in order; each says which stage waits on it.

- [ ] **H1** Node 22 LTS and pnpm on the machine, or tell the agent it may install them. *(Stage 0)*
- [ ] **H2** GitHub: repo `ivnbogdan/exams` exists and is being reused. Done. *(Stage 0)*
- [ ] **H3** Vercel: confirm Hobby plan under Settings → Billing. Import the repo as a project, framework Next.js. First deploy may fail; that is fine. *(before Stage 6)*
- [ ] **H4** Vercel project → Storage → Create Database → **Neon**, Free plan, connect to all environments. Copy `DATABASE_URL` to the agent. *(Stage 1)*
- [ ] **H5** Cloudflare account, add zone `exams.ro` on Free plan, note the two nameservers. *(Stage 2)*
- [ ] **H6** At the registrar, switch exams.ro nameservers to Cloudflare. First copy any existing DNS records, especially MX if you use email on the domain, into Cloudflare DNS. The old site keeps working. *(cutover, can be done early)*
- [ ] **H7** Cloudflare R2: enable R2 (needs a payment method, free tier is 0 €). Bucket `exams-ro-files`. Bucket Settings → Custom Domains → `files.exams.ro`. Enable the r2.dev public dev URL as a temporary base URL. Manage R2 API Tokens → create token, **Object Read & Write**, this bucket only. Give the agent: account id, access key id, secret access key, bucket name, public base URL. *(Stage 2)*
- [ ] **H8** On the machine: `vercel login`, then in the repo `vercel link`. *(Stage 1, optional but useful)*
- [ ] **H9** Paste the values from H4 and H7 to the agent for `.env.local`, and add the same in Vercel → Settings → Environment Variables for Production and Preview. *(Stage 2 locally, Stage 6 on Vercel)*
- [ ] **H10** Vercel → Settings → Domains → add `exams.ro` and `www.exams.ro`. Add the records Vercel shows into Cloudflare DNS with the proxy **off** (grey cloud). Remove the old A record. *(cutover)*
- [ ] **H11** Check the live site, then cancel the old gazduire.ro hosting when convenient. Keep `~/repos/personal/exams-ro-export/` as the permanent backup. *(after cutover)*

Accounts involved: GitHub (existing), Vercel (existing, Hobby), Neon (created through Vercel, no separate signup), Cloudflare (new, free, payment method required to enable R2), domain registrar (existing).

Monthly cost when done: 0.
