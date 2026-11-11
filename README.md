# India Openings: Pan-India job portal

Next.js 15 (App Router) + Supabase (Postgres, RLS, Auth, Edge Functions) + Tailwind 4. Deploys to Vercel or Netlify.

## Structure

```
supabase/
  migrations/001_schema.sql          tables, RLS, employer verification triggers
  migrations/002_seed_companies.sql  30 real companies across 6 hubs
  functions/aggregate-jobs/index.ts  job aggregator (Greenhouse / Lever / Ashby) + Brandfetch logos
src/
  middleware.ts                      refreshes Supabase session
  lib/{constants,format}.ts          cities, free-email list, GSTIN/CIN regex
  lib/supabase/server.ts
  components/{SearchFilters,JobCard,CompanyLogo,VerifiedBadge}.tsx
  app/page.tsx                       search + results (server-rendered, URL-driven filters)
  app/employer/{page,actions,signup/page}.tsx   onboarding + post/close jobs
  app/login/page.tsx, app/auth/callback/route.ts
```

## 1. Supabase

1. Create a project. **Auth > Providers > Email: keep "Confirm email" ON** (verification depends on it).
2. Run `001_schema.sql`, then `002_seed_companies.sql` in the SQL editor (or `supabase db push`).
3. **Auth > URL Configuration**: set Site URL to your production URL and add `https://YOUR-DOMAIN/auth/callback` and `http://localhost:3000/auth/callback` to Redirect URLs.

## 2. Aggregator Edge Function

```bash
supabase link --project-ref YOUR-PROJECT-REF
supabase secrets set CRON_SECRET=$(openssl rand -hex 24) BRANDFETCH_CLIENT_ID=xxx BRANDFETCH_API_KEY=xxx
supabase functions deploy aggregate-jobs --no-verify-jwt
# test it
curl -X POST https://YOUR-PROJECT-REF.supabase.co/functions/v1/aggregate-jobs -H "x-cron-secret: YOUR_CRON_SECRET"
```

Schedule it every 6 hours (SQL editor; enable `pg_cron` and `pg_net` under Database > Extensions):

```sql
select cron.schedule('aggregate-jobs', '0 */6 * * *', $$
  select net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/aggregate-jobs',
    headers := jsonb_build_object('x-cron-secret', 'YOUR_CRON_SECRET'));
$$);
```

**Adding more companies to the feed:** set `ats_type` (`greenhouse` | `lever` | `ashby`) and `ats_slug` on the company row. The slug is the last part of its job-board URL, e.g. `boards.greenhouse.io/<slug>`, `jobs.lever.co/<slug>`, `jobs.ashbyhq.com/<slug>`. Test the slug in a browser first (`https://boards-api.greenhouse.io/v1/boards/<slug>/jobs`).

### Data sourcing: what is and isn't legal here
- Greenhouse, Lever and Ashby publish these JSON endpoints so job boards can syndicate listings. That's the safe route and is what the function uses.
- Many companies run Workday, SuccessFactors or custom portals with no public feed. Scraping those can breach their terms; check `robots.txt` and the site's ToS, or ask the company for a feed. Puppeteer can't run inside Edge Functions (no browser binary). If you need it, run it as a scheduled GitHub Action that writes to Supabase with the service role key.
- Don't scrape Naukri, LinkedIn, Indeed or other job boards. Their terms prohibit it.
- Indian postings rarely publish salary, so `salary_*_inr` will be mostly empty for aggregated jobs. The UI says "Salary not disclosed" and keeps them in salary-filtered results.

## 3. Local run

```bash
cp .env.example .env.local   # fill NEXT_PUBLIC_* values
npm install && npm run dev
```

## 4. GitHub + deploy

```bash
git init && git add . && git commit -m "India Openings"
gh repo create india-openings --private --source=. --push
```

**Vercel:** Add New > Project > import the repo > Framework: Next.js (auto) > add the env vars below > Deploy.
**Netlify:** Add new site > Import from Git > the Next.js runtime is detected automatically > add the same env vars > Deploy.

| Variable | Where | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel/Netlify | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel/Netlify | anon public key |
| `NEXT_PUBLIC_SITE_URL` | Vercel/Netlify | `https://your-domain` (used in the confirmation email link) |
| `CRON_SECRET`, `BRANDFETCH_CLIENT_ID`, `BRANDFETCH_API_KEY` | `supabase secrets set` only | see above |

Never put the service-role key in Vercel/Netlify. The Edge Function already receives it from Supabase.

## How verification works

1. **Free-domain block:** form check for friendly errors, plus a database trigger (`handle_new_user`) as the real gate. It reads `blocked_email_domains`, so you can add domains with SQL.
2. **Domain match:** the employer's email domain decides their company. Signing up as `x@infosys.com` attaches you to the seeded Infosys row; it never creates a duplicate.
3. **Confirmed email:** Supabase blocks login until the work email is confirmed, which proves control of the domain.
4. **GSTIN/CIN (optional):** format-validated by regex and DB check constraints. A new company is marked `is_verified` only when the email is confirmed **and** a GSTIN or CIN is present. A format check doesn't prove the number is real; for stronger assurance, verify against the GST or MCA portals (or a paid API) and flip `is_verified` yourself with the service role.
5. **RLS:** `is_verified` can't be edited by employers (no update policy on `companies`), and they can only insert, update or delete jobs for their own company.

## Notes
- Logos: Brandfetch (Logo CDN + Brand API). Clearbit's free logo API has been shut down, so it isn't used.
- Company career-page URLs and the two ATS slugs in the seed (`razorpaysoftware`, `postman`) were written from memory and not tested live. Run the function once and read its JSON report, and click through the `careers_url` links, before launch.
