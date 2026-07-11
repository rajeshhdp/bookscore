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
insert into books (category, title, sort_order) values
  ('bhagavad_gita', 'English Hardbound', 1),
  ('bhagavad_gita', 'English Softbound', 2),
  ('bhagavad_gita', 'Nepali', 3),
  ('bhagavad_gita', 'Spanish', 4),
  ('bhagavad_gita', 'Other Languages', 5),
  ('srimad_bhagavatam', 'Full Set', 1),
  ('srimad_bhagavatam', 'Individual Canto', 2),
  ('krishna_books', 'Krishna Book', 1),
  ('krishna_books', 'Small Krishna Books', 2),
  ('other', 'Science of Self Realization', 1),
  ('other', 'Beyond Birth and Death', 2),
  ('other', 'Yoga and Bhakti Yoga', 3),
  ('other', 'Gita Wisdom Tales', 4),
  ('other', 'Other', 5)
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
  v_bg_hard uuid;
  v_bg_soft uuid;
  v_krishna uuid;
  v_ssr uuid;
  v_sb_set uuid;
  v_entry uuid;
begin
  if exists (select 1 from distribution_entries) then
    return;
  end if;

  select id into v_region_fw from regions where name = 'Fort Worth';
  select id into v_region_irving from regions where name = 'Irving';
  select id into v_region_plano from regions where name = 'Plano';
  select id into v_bg_hard from books where category = 'bhagavad_gita' and title = 'English Hardbound';
  select id into v_bg_soft from books where category = 'bhagavad_gita' and title = 'English Softbound';
  select id into v_krishna from books where category = 'krishna_books' and title = 'Krishna Book';
  select id into v_ssr from books where category = 'other' and title = 'Science of Self Realization';
  select id into v_sb_set from books where category = 'srimad_bhagavatam' and title = 'Full Set';

  insert into distribution_entries (devotee_name, region_id, location_note, date, donation_amount)
  values ('Hari Prabhu', v_region_fw, 'India Bazaar', current_date - 2, 108.00)
  returning id into v_entry;
  insert into entry_items (entry_id, book_id, quantity) values
    (v_entry, v_bg_hard, 8), (v_entry, v_bg_soft, 12), (v_entry, v_krishna, 2);

  insert into distribution_entries (devotee_name, region_id, location_note, date, donation_amount)
  values ('Radha Mataji', v_region_irving, 'Walmart Table', current_date - 1, 54.00)
  returning id into v_entry;
  insert into entry_items (entry_id, book_id, quantity) values
    (v_entry, v_bg_soft, 15), (v_entry, v_ssr, 4);

  insert into distribution_entries (devotee_name, region_id, location_note, date, donation_amount)
  values ('Govinda Prabhu', v_region_plano, 'Festival Booth', current_date, 251.00)
  returning id into v_entry;
  insert into entry_items (entry_id, book_id, quantity) values
    (v_entry, v_bg_hard, 5), (v_entry, v_sb_set, 1), (v_entry, v_krishna, 3);
end;
$$;
