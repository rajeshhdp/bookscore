# BookScore DFW 🪷

A joyful seva platform for tracking book distribution across the DFW devotee
community — a simple, beautiful replacement for WhatsApp score reporting.

> “Every book distributed is a spiritual seed planted.”

## Features

- **30-second score submission** — mobile-first form with big `[−] n [+]`
  counters for every title (Bhagavad-gita, Srimad Bhagavatam, Krishna Books,
  and more), optional donation entry, and no account required
- **Community dashboard** — books, devotees, locations, and donations this
  month, a collective progress bar, gentle "Seva Contributions" leaderboard
  (with a hide-my-name option), and recent activity
- **Marathon campaigns** — coordinators create campaigns (e.g. Bhagavad-gita
  Marathon) with goals and date windows; progress, days remaining,
  participants, and regional breakdowns are tracked automatically
- **Region dashboards** — per-region books, active devotees, and top locations
- **Coordinator admin** — analytics charts (daily trend, monthly growth,
  region comparison, category breakdown, donation trend), entry corrections,
  CSV export, and campaign/announcement/book-catalog management
- **Achievements** — gentle encouragement: 🌱 First Book, 📚 100 Books,
  🌟 Marathon Participant
- **Sign-in optional** — email magic link (no passwords) links your entries to
  a profile and unlocks personal stats

## Tech Stack

Runs entirely on **free tiers**:

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions) + TypeScript |
| Styling | Tailwind CSS v4, shadcn-style components |
| Database & Auth | Supabase (Postgres + RLS + magic-link auth) |
| Charts | Recharts |
| Hosting | Vercel Free Tier |

## Quick Start

1. **Create a Supabase project** and run `supabase/migrations/0001_init.sql`,
   then `supabase/seed.sql`, in the SQL editor.
2. **Configure env vars** — copy `.env.example` to `.env.local` and fill in
   your Supabase URL and anon key.
3. `npm install && npm run dev`

Full walkthrough (including Vercel deployment and making yourself a
coordinator): **[docs/SETUP.md](docs/SETUP.md)**.

## Project Layout

```
app/                 Pages: home, submit, dashboard, campaigns, regions, me, admin
components/          UI building blocks (counters, cards, charts, nav)
lib/actions/         Server actions (submit entry, auth, admin CRUD, CSV export)
lib/queries.ts       Typed read queries over the aggregate RPCs
supabase/migrations/ Database schema, RLS policies, aggregate functions
supabase/seed.sql    DFW regions, book catalog, sample campaign, demo entries
docs/SETUP.md        Supabase + Vercel setup instructions
```

## Privacy model

Raw entries are readable only by their owner and coordinators. Public
dashboards read pre-aggregated numbers through `security definer` SQL
functions, and devotees can appear as “A Devotee” on leaderboards via a
profile toggle.

---

Hare Krishna 🙏 Built with love for the DFW devotee community.
