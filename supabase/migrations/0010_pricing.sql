-- blobbyofficial: per-video pricing, managed from /admin/pricing.
--
-- Three moving parts so the whole page is editable without a deploy:
--   pricing_tiers      one row per column (Free / Short / Longform)
--   pricing_features   one row per comparison line, with a per-tier value
--   pricing_settings   the single-row page copy (heading, payment note)
--
-- A feature's values live in a jsonb map keyed by tier slug rather than in a
-- join table: the admin dashboard is plain server-action forms, and a map
-- lets a feature row render one input per tier instead of needing a separate
-- screen for the cross product. Adding a tier is then a one-row insert, and
-- features that have no value for it simply fall back to "-".

create extension if not exists "pgcrypto";

-- ── PRICING TIERS ────────────────────────────────────────────────────────
create table if not exists public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price_label text not null default '$0',
  -- What the price actually buys in Discord Nitro terms, e.g. "1 month of
  -- Discord Nitro". Nitro gifts are the only accepted payment.
  price_note text not null default '',
  description text not null default '',
  cta_label text not null default 'Get in touch',
  cta_url text not null default '/contact',
  -- Marks the column that gets the accent border on the pricing page.
  highlighted boolean not null default false,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pricing_tiers enable row level security;

create policy "Public can read published pricing tiers"
  on public.pricing_tiers for select
  using (published = true);

create policy "Admins can manage pricing tiers"
  on public.pricing_tiers for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── PRICING FEATURES ─────────────────────────────────────────────────────
create table if not exists public.pricing_features (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  -- Optional one-line explanation shown under the label.
  note text not null default '',
  -- { "<tier slug>": "<value>" }. Values are rendered verbatim, so "yes",
  -- "no" and "-" are mapped to tick/cross/dash marks at render time and
  -- anything else ("30 seconds") prints as written.
  values jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pricing_features enable row level security;

create policy "Public can read published pricing features"
  on public.pricing_features for select
  using (published = true);

create policy "Admins can manage pricing features"
  on public.pricing_features for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── PRICING SETTINGS ─────────────────────────────────────────────────────
-- Single row, pinned by the `id = 1` check so an accidental insert can't
-- create a second copy of the page copy.
create table if not exists public.pricing_settings (
  id integer primary key default 1 check (id = 1),
  heading text not null default 'Pricing',
  subheading text not null default 'per video',
  description text not null default '',
  payment_note text not null default '',
  footnote text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.pricing_settings enable row level security;

create policy "Public can read pricing settings"
  on public.pricing_settings for select
  using (true);

create policy "Admins can manage pricing settings"
  on public.pricing_settings for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── SEED ─────────────────────────────────────────────────────────────────
-- Mirrors the fallback content in src/lib/content.ts so a freshly migrated
-- project renders the same page the code-only fallback does.
insert into public.pricing_settings (id, heading, subheading, description, payment_note, footnote)
values (
  1,
  'Pricing',
  'per video',
  'One price per video, no retainers and no subscriptions. Pick the tier that matches the edit you need.',
  'Payment is Discord Nitro only — $10 is one month of Nitro, $100 is a year. Gift it to me on Discord once the edit is approved.',
  'Prices are per finished video. Anything outside these tiers, message me and we will work it out.'
)
on conflict (id) do nothing;

insert into public.pricing_tiers (slug, name, price_label, price_note, description, cta_label, cta_url, highlighted, sort_order)
values
  ('free', 'Free', '$0', 'No payment', 'A short edit when I have time free. Great for a first test run.', 'Ask for a free edit', '/contact', false, 0),
  ('short', 'Short', '$10', '1 month of Discord Nitro', 'Short-form edits with a deadline you set and a proper revision pass.', 'Book a short edit', '/contact', true, 1),
  ('longform', 'Longform', '$100', '1 year of Discord Nitro', 'Full longform edits — YouTube videos, montages and client work.', 'Book a longform edit', '/contact', false, 2)
on conflict (slug) do nothing;

insert into public.pricing_features (label, note, values, sort_order)
values
  ('Deadline', 'Whether you can hold me to a delivery date', '{"free":"no","short":"yes","longform":"yes"}', 0),
  ('Max length', 'Length of the finished video', '{"free":"30 seconds","short":"90 seconds","longform":"15 minutes"}', 1),
  ('Revisions', 'Rounds of changes after the first cut', '{"free":"1","short":"3","longform":"Unlimited"}', 2),
  ('Typical turnaround', 'From footage received to first cut', '{"free":"Whenever I am free","short":"3-5 days","longform":"1-2 weeks"}', 3),
  ('Queue priority', 'Where your edit sits in the queue', '{"free":"Last","short":"Normal","longform":"First"}', 4),
  ('Colour grading', '', '{"free":"no","short":"yes","longform":"yes"}', 5),
  ('Sound design & SFX', '', '{"free":"Basic","short":"Full","longform":"Full"}', 6),
  ('Motion graphics & VFX', '', '{"free":"no","short":"Light","longform":"Advanced"}', 7),
  ('Captions & subtitles', '', '{"free":"yes","short":"yes","longform":"yes"}', 8),
  ('Export quality', '', '{"free":"1080p","short":"1080p","longform":"Up to 4K"}', 9),
  ('Custom thumbnail', '', '{"free":"no","short":"no","longform":"yes"}', 10),
  ('Project file included', 'The DaVinci Resolve project, not just the export', '{"free":"no","short":"no","longform":"yes"}', 11),
  ('Commercial use', 'Use the edit for sponsored or paid content', '{"free":"no","short":"yes","longform":"yes"}', 12),
  ('Credit required', 'Whether you have to credit me in the description', '{"free":"yes","short":"Optional","longform":"Optional"}', 13)
on conflict do nothing;
