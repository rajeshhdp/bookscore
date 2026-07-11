# Setup Guide

Everything runs on free tiers: Supabase (database + auth) and Vercel (hosting).
Total setup time: about 15 minutes.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project** (the free plan
   is fine).
2. Pick any strong database password (you won't need it day-to-day).
3. Wait for the project to finish provisioning.

## 2. Create the database schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Paste the entire contents of
   [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
   and click **Run**. This creates all tables, row-level-security policies,
   and the aggregate functions the dashboards use.
3. Then paste and run [`supabase/seed.sql`](../supabase/seed.sql). This adds
   the DFW regions, the book catalog, a sample campaign, an announcement, and
   (only if the database is empty) a few demo entries so you can see the
   dashboards working. It is safe to run more than once.

> To remove the demo entries later:
> `delete from distribution_entries where user_id is null and devotee_name in ('Hari Prabhu','Radha Mataji','Govinda Prabhu');`

## 3. Configure authentication

1. In **Authentication → Sign In / Up**, make sure the **Email** provider is
   enabled (it is by default). Magic links work out of the box — no SMTP setup
   is required for low volume, though Supabase's built-in email has a rate
   limit of a few emails per hour. For a real community deployment, add a free
   SMTP provider (e.g. Resend) under **Authentication → Emails → SMTP**.
2. In **Authentication → URL Configuration**:
   - Set **Site URL** to your production URL (e.g.
     `https://your-app.vercel.app`) once deployed.
   - Add `http://localhost:3000/**` and `https://your-app.vercel.app/**` to
     **Redirect URLs**.

## 4. Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` API key |

The anon key is safe to expose to browsers — row-level security controls all
data access.

## 5. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Submit a test score from **Submit Score** — it
should appear on the dashboard immediately.

## 6. Make yourself a coordinator

1. Sign in on the site (**My Seva → Sign In**) with your email.
2. In the Supabase **SQL Editor**, run:

   ```sql
   update profiles set role = 'coordinator'
   where email = 'you@example.com';
   ```

3. Reload the site — the **Admin** button appears on the My Seva page, with
   analytics, entry corrections, CSV export, and campaign/announcement/book
   management.

## 7. Deploy to Vercel

1. Push this repository to GitHub.
2. At [vercel.com](https://vercel.com) → **Add New → Project**, import the
   repo. The Next.js defaults are correct.
3. Add the two environment variables from step 4 under
   **Settings → Environment Variables** (or during import).
4. Deploy. Then go back to Supabase **Authentication → URL Configuration**
   and set the Site URL / Redirect URLs to your Vercel domain (step 3.2).

Everything fits the Vercel free tier: server-rendered pages, server actions,
and no cron jobs, image storage, or background workers.

## Troubleshooting

- **"Supabase is not configured yet" banner** — the two env vars are missing
  in that environment (local `.env.local` or Vercel project settings).
- **Magic-link email never arrives** — Supabase's built-in email sender is
  heavily rate-limited; configure SMTP (step 3.1) or wait a few minutes.
- **Magic link lands on "link error" page** — the Redirect URLs in Supabase
  don't include the domain you're using (step 3.2).
- **Admin area says access is missing** — your profile row isn't
  `coordinator` yet (step 6).
