-- BookScore seed data. Safe to run more than once.
-- Run AFTER migrations, in the Supabase SQL editor (or `supabase db push` + this file).

-- ---------------------------------------------------------------------------
-- Regions (DFW metro)
-- ---------------------------------------------------------------------------
insert into regions (name, sort_order) values
  ('Fort Worth', 1),
  ('Haslet', 2),
  ('Keller', 3),
  ('Roanoke', 4),
  ('Northlake', 5),
  ('Argyle', 6),
  ('Irving', 7),
  ('Dallas', 8),
  ('Plano', 9),
  ('Other', 10)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Book catalog
-- ---------------------------------------------------------------------------
insert into books (category, title, code, description, sort_order) values
  ('book', 'Small Book', 'H1', '50–150 pages', 1),
  ('book', 'Medium Book', 'H2', '150–300 pages', 2),
  ('book', 'Big Book', 'H3', '300–500 pages', 3),
  ('book', 'Maha Big Book', 'H4', '500+ pages', 4),
  ('set', 'SB Set', 'TS', 'Srimad Bhagavatam set', 1),
  ('set', 'CC Set', 'TS', 'Chaitanya Charitamrita set', 2),
  ('set', 'SPL Set', 'TS', null, 3),
  ('magazine', 'Magazine', 'M1', '0–15 pages', 1)
on conflict (category, title) do nothing;

-- ---------------------------------------------------------------------------
-- Sample campaign & announcement
-- ---------------------------------------------------------------------------
insert into campaigns (name, description, type, start_date, end_date, goal, active)
select
  'Bhagavad-gita Marathon ' || extract(year from current_date)::int,
  'Our annual December marathon — every Bhagavad-gita placed in someone''s hands is a seed of Krishna consciousness planted in DFW.',
  'bhagavad_gita',
  make_date(extract(year from current_date)::int, 12, 1),
  make_date(extract(year from current_date)::int, 12, 31),
  10000,
  true
where not exists (select 1 from campaigns);

insert into announcements (title, body, active)
select
  'Weekly Book Distribution at India Bazaar',
  'Join us every Saturday at India Bazaar for sankirtana. All devotees welcome — books, tables, and prasadam provided!',
  true
where not exists (select 1 from announcements);

-- ---------------------------------------------------------------------------
-- Demo entries (only inserted into an empty database, for testing the UI)
-- ---------------------------------------------------------------------------
do $$
declare
  v_region_fw uuid;
  v_region_irving uuid;
  v_region_plano uuid;
  v_small uuid;
  v_medium uuid;
  v_big uuid;
  v_maha uuid;
  v_sb_set uuid;
  v_magazine uuid;
  v_entry uuid;
begin
  if exists (select 1 from distribution_entries) then
    return;
  end if;

  select id into v_region_fw from regions where name = 'Fort Worth';
  select id into v_region_irving from regions where name = 'Irving';
  select id into v_region_plano from regions where name = 'Plano';
  select id into v_small from books where title = 'Small Book';
  select id into v_medium from books where title = 'Medium Book';
  select id into v_big from books where title = 'Big Book';
  select id into v_maha from books where title = 'Maha Big Book';
  select id into v_sb_set from books where title = 'SB Set';
  select id into v_magazine from books where title = 'Magazine';

  insert into distribution_entries (devotee_name, region_id, location_note, date, donation_amount)
  values ('Hari Prabhu', v_region_fw, 'India Bazaar', current_date - 2, 108.00)
  returning id into v_entry;
  insert into entry_items (entry_id, book_id, quantity) values
    (v_entry, v_big, 8), (v_entry, v_small, 12), (v_entry, v_magazine, 2);

  insert into distribution_entries (devotee_name, region_id, location_note, date, donation_amount)
  values ('Radha Mataji', v_region_irving, 'Walmart Table', current_date - 1, 54.00)
  returning id into v_entry;
  insert into entry_items (entry_id, book_id, quantity) values
    (v_entry, v_small, 15), (v_entry, v_medium, 4);

  insert into distribution_entries (devotee_name, region_id, location_note, date, donation_amount)
  values ('Govinda Prabhu', v_region_plano, 'Festival Booth', current_date, 251.00)
  returning id into v_entry;
  insert into entry_items (entry_id, book_id, quantity) values
    (v_entry, v_maha, 5), (v_entry, v_sb_set, 1), (v_entry, v_big, 3);
end;
$$;
