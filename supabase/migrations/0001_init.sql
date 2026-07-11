-- BookScore: DFW Book Distribution Dashboard
-- Initial schema. Run this in the Supabase SQL editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type book_category as enum (
  'bhagavad_gita',
  'srimad_bhagavatam',
  'krishna_books',
  'other'
);

create type campaign_type as enum (
  'bhagavad_gita',
  'srimad_bhagavatam',
  'general'
);

create type user_role as enum ('devotee', 'coordinator');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  coordinator_name text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text,
  phone text,
  region_id uuid references regions (id) on delete set null,
  role user_role not null default 'devotee',
  hide_from_leaderboard boolean not null default false,
  created_at timestamptz not null default now()
);

create table books (
  id uuid primary key default gen_random_uuid(),
  category book_category not null,
  title text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (category, title)
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type campaign_type not null default 'general',
  start_date date not null,
  end_date date not null,
  goal integer not null default 0 check (goal >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table distribution_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  devotee_name text not null check (length(trim(devotee_name)) > 0),
  region_id uuid references regions (id) on delete set null,
  location_note text,
  date date not null default current_date,
  donation_amount numeric(10, 2) not null default 0 check (donation_amount >= 0),
  campaign_id uuid references campaigns (id) on delete set null,
  created_at timestamptz not null default now()
);

create table entry_items (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references distribution_entries (id) on delete cascade,
  book_id uuid not null references books (id),
  quantity int not null check (quantity > 0)
);

create index idx_entries_date on distribution_entries (date);
create index idx_entries_region on distribution_entries (region_id);
create index idx_entries_campaign on distribution_entries (campaign_id);
create index idx_entries_user on distribution_entries (user_id);
create index idx_items_entry on entry_items (entry_id);
create index idx_items_book on entry_items (book_id);

-- ---------------------------------------------------------------------------
-- Profile auto-creation on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'coordinator'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table regions enable row level security;
alter table profiles enable row level security;
alter table books enable row level security;
alter table campaigns enable row level security;
alter table announcements enable row level security;
alter table distribution_entries enable row level security;
alter table entry_items enable row level security;

-- Reference data: readable by everyone, writable by coordinators.
create policy "regions readable" on regions for select using (true);
create policy "regions coordinator write" on regions
  for all using (is_coordinator()) with check (is_coordinator());

create policy "books readable" on books for select using (true);
create policy "books coordinator write" on books
  for all using (is_coordinator()) with check (is_coordinator());

create policy "campaigns readable" on campaigns for select using (true);
create policy "campaigns coordinator write" on campaigns
  for all using (is_coordinator()) with check (is_coordinator());

create policy "announcements readable" on announcements for select using (true);
create policy "announcements coordinator write" on announcements
  for all using (is_coordinator()) with check (is_coordinator());

-- Profiles: users manage their own; coordinators can read all.
create policy "profiles self read" on profiles
  for select using (id = auth.uid() or is_coordinator());
create policy "profiles self insert" on profiles
  for insert with check (id = auth.uid());
create policy "profiles self update" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Entries: anyone (including guests) may submit; raw rows are visible only to
-- their owner or a coordinator. Public dashboards read aggregates via the
-- security-definer functions below.
create policy "entries insert" on distribution_entries
  for insert with check (user_id is null or user_id = auth.uid());
create policy "entries owner read" on distribution_entries
  for select using (user_id = auth.uid() or is_coordinator());
create policy "entries owner update" on distribution_entries
  for update using (user_id = auth.uid() or is_coordinator())
  with check (user_id = auth.uid() or is_coordinator());
create policy "entries coordinator delete" on distribution_entries
  for delete using (user_id = auth.uid() or is_coordinator());

create policy "items insert" on entry_items
  for insert with check (
    exists (
      select 1 from distribution_entries e
      where e.id = entry_id
        and (e.user_id is null or e.user_id = auth.uid())
    )
  );
create policy "items owner read" on entry_items
  for select using (
    exists (
      select 1 from distribution_entries e
      where e.id = entry_id
        and (e.user_id = auth.uid() or is_coordinator())
    )
  );
create policy "items owner update" on entry_items
  for update using (
    exists (
      select 1 from distribution_entries e
      where e.id = entry_id
        and (e.user_id = auth.uid() or is_coordinator())
    )
  );
create policy "items coordinator delete" on entry_items
  for delete using (
    exists (
      select 1 from distribution_entries e
      where e.id = entry_id
        and (e.user_id = auth.uid() or is_coordinator())
    )
  );

-- ---------------------------------------------------------------------------
-- Aggregate functions (security definer): power the public dashboards without
-- exposing raw entries. All are read-only.
-- ---------------------------------------------------------------------------

-- Display name for leaderboards: honors profiles.hide_from_leaderboard.
create or replace function public.entry_display_name(p_user_id uuid, p_devotee_name text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_user_id is not null and exists (
      select 1 from profiles where id = p_user_id and hide_from_leaderboard
    ) then 'A Devotee'
    else p_devotee_name
  end;
$$;

create or replace function public.monthly_summary(p_start date, p_end date)
returns table (
  books bigint,
  devotees bigint,
  locations bigint,
  donations numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select sum(i.quantity)
      from entry_items i
      join distribution_entries e on e.id = i.entry_id
      where e.date between p_start and p_end
    ), 0)::bigint as books,
    (
      select count(distinct coalesce(e.user_id::text, lower(trim(e.devotee_name))))
      from distribution_entries e
      where e.date between p_start and p_end
    )::bigint as devotees,
    (
      select count(distinct coalesce(nullif(trim(e.location_note), ''), r.name))
      from distribution_entries e
      left join regions r on r.id = e.region_id
      where e.date between p_start and p_end
    )::bigint as locations,
    coalesce((
      select sum(e.donation_amount)
      from distribution_entries e
      where e.date between p_start and p_end
    ), 0) as donations;
$$;

create or replace function public.leaderboard(p_start date, p_end date, p_limit int default 10)
returns table (display_name text, books bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    entry_display_name(e.user_id, min(e.devotee_name)) as display_name,
    sum(i.quantity)::bigint as books
  from distribution_entries e
  join entry_items i on i.entry_id = e.id
  where e.date between p_start and p_end
  group by coalesce(e.user_id::text, lower(trim(e.devotee_name))), e.user_id
  order by books desc
  limit p_limit;
$$;

create or replace function public.daily_trend(p_start date, p_end date)
returns table (day date, books bigint, donations numeric)
language sql
stable
security definer
set search_path = public
as $$
  with per_entry as (
    select e.date as day, sum(e.donation_amount) as donations
    from distribution_entries e
    where e.date between p_start and p_end
    group by e.date
  ),
  per_book as (
    select e.date as day, sum(i.quantity) as books
    from distribution_entries e
    join entry_items i on i.entry_id = e.id
    where e.date between p_start and p_end
    group by e.date
  )
  select d.day, coalesce(b.books, 0)::bigint as books, d.donations
  from per_entry d
  left join per_book b on b.day = d.day
  order by d.day;
$$;

create or replace function public.monthly_trend(p_months int default 6)
returns table (month text, books bigint, donations numeric)
language sql
stable
security definer
set search_path = public
as $$
  with since as (
    select (date_trunc('month', current_date) - make_interval(months => p_months - 1))::date as start
  ),
  per_entry as (
    select date_trunc('month', e.date)::date as m, sum(e.donation_amount) as donations
    from distribution_entries e, since
    where e.date >= since.start
    group by 1
  ),
  per_book as (
    select date_trunc('month', e.date)::date as m, sum(i.quantity) as books
    from distribution_entries e
    join entry_items i on i.entry_id = e.id
    cross join since
    where e.date >= since.start
    group by 1
  )
  select to_char(d.m, 'YYYY-MM') as month,
    coalesce(b.books, 0)::bigint as books,
    d.donations
  from per_entry d
  left join per_book b on b.m = d.m
  order by 1;
$$;

create or replace function public.region_summary(p_start date, p_end date)
returns table (
  region_id uuid,
  region_name text,
  books bigint,
  devotees bigint,
  donations numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id as region_id,
    r.name as region_name,
    coalesce((
      select sum(i.quantity)
      from entry_items i
      join distribution_entries e on e.id = i.entry_id
      where e.region_id = r.id and e.date between p_start and p_end
    ), 0)::bigint as books,
    (
      select count(distinct coalesce(e.user_id::text, lower(trim(e.devotee_name))))
      from distribution_entries e
      where e.region_id = r.id and e.date between p_start and p_end
    )::bigint as devotees,
    coalesce((
      select sum(e.donation_amount)
      from distribution_entries e
      where e.region_id = r.id and e.date between p_start and p_end
    ), 0) as donations
  from regions r
  order by books desc;
$$;

create or replace function public.category_breakdown(p_start date, p_end date)
returns table (category book_category, books bigint)
language sql
stable
security definer
set search_path = public
as $$
  select b.category, sum(i.quantity)::bigint as books
  from entry_items i
  join books b on b.id = i.book_id
  join distribution_entries e on e.id = i.entry_id
  where e.date between p_start and p_end
  group by b.category
  order by books desc;
$$;

-- Campaign progress counts books distributed inside the campaign window that
-- match the campaign type (all books for 'general' campaigns).
create or replace function public.campaign_stats(p_campaign_id uuid)
returns table (books bigint, participants bigint, donations numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select sum(i.quantity)
      from entry_items i
      join books b on b.id = i.book_id
      join distribution_entries e on e.id = i.entry_id
      where e.date between c.start_date and c.end_date
        and (c.type = 'general' or b.category::text = c.type::text)
    ), 0)::bigint as books,
    (
      select count(distinct coalesce(e.user_id::text, lower(trim(e.devotee_name))))
      from distribution_entries e
      where e.date between c.start_date and c.end_date
    )::bigint as participants,
    coalesce((
      select sum(e.donation_amount)
      from distribution_entries e
      where e.date between c.start_date and c.end_date
    ), 0) as donations
  from campaigns c
  where c.id = p_campaign_id;
$$;

create or replace function public.campaign_region_breakdown(p_campaign_id uuid)
returns table (region_name text, books bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.name as region_name, sum(i.quantity)::bigint as books
  from entry_items i
  join books b on b.id = i.book_id
  join distribution_entries e on e.id = i.entry_id
  join regions r on r.id = e.region_id
  join campaigns c on c.id = p_campaign_id
  where e.date between c.start_date and c.end_date
    and (c.type = 'general' or b.category::text = c.type::text)
  group by r.name
  order by books desc;
$$;

create or replace function public.region_top_locations(p_region_id uuid, p_start date, p_end date, p_limit int default 5)
returns table (location text, books bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(trim(e.location_note), ''), 'Various locations') as location,
    sum(i.quantity)::bigint as books
  from distribution_entries e
  join entry_items i on i.entry_id = e.id
  where e.region_id = p_region_id and e.date between p_start and p_end
  group by 1
  order by books desc
  limit p_limit;
$$;

create or replace function public.recent_activity(p_limit int default 10)
returns table (
  display_name text,
  region_name text,
  books bigint,
  entry_date date,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    entry_display_name(e.user_id, e.devotee_name) as display_name,
    r.name as region_name,
    coalesce(sum(i.quantity), 0)::bigint as books,
    e.date as entry_date,
    e.created_at
  from distribution_entries e
  left join regions r on r.id = e.region_id
  left join entry_items i on i.entry_id = e.id
  group by e.id, r.name
  order by e.created_at desc
  limit p_limit;
$$;

create or replace function public.personal_stats(p_user_id uuid)
returns table (
  total_books bigint,
  total_entries bigint,
  total_donations numeric,
  first_entry_date date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select sum(i.quantity)
      from entry_items i
      join distribution_entries e on e.id = i.entry_id
      where e.user_id = p_user_id
    ), 0)::bigint as total_books,
    (select count(*) from distribution_entries where user_id = p_user_id)::bigint as total_entries,
    coalesce((select sum(donation_amount) from distribution_entries where user_id = p_user_id), 0) as total_donations,
    (select min(date) from distribution_entries where user_id = p_user_id) as first_entry_date;
$$;

grant execute on function
  public.entry_display_name(uuid, text),
  public.monthly_summary(date, date),
  public.leaderboard(date, date, int),
  public.daily_trend(date, date),
  public.monthly_trend(int),
  public.region_summary(date, date),
  public.category_breakdown(date, date),
  public.campaign_stats(uuid),
  public.campaign_region_breakdown(uuid),
  public.region_top_locations(uuid, date, date, int),
  public.recent_activity(int),
  public.personal_stats(uuid)
to anon, authenticated;
