-- blobbyofficial: content + contact schema
-- Run this against your Supabase project (SQL Editor, or `supabase db push`).

create extension if not exists "pgcrypto";

-- ── PORTFOLIO CLIPS ──────────────────────────────────────────────────────
create table if not exists public.portfolio_clips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  thumbnail_url text not null,
  video_url text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.portfolio_clips enable row level security;

create policy "Public can read published portfolio clips"
  on public.portfolio_clips for select
  using (published = true);

create policy "Authenticated users can manage portfolio clips"
  on public.portfolio_clips for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── PRODUCTS ─────────────────────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  tags text[] not null default '{}',
  preview_image_url text not null,
  buy_url text not null,
  price_label text not null default 'Free',
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Public can read published products"
  on public.products for select
  using (published = true);

create policy "Authenticated users can manage products"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── CONTACT MESSAGES ─────────────────────────────────────────────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone (including anonymous visitors) can submit a message, but only the
-- signed-in admin can read or manage them afterward.
create policy "Anyone can submit a contact message"
  on public.contact_messages for insert
  with check (true);

create policy "Authenticated users can read contact messages"
  on public.contact_messages for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can update contact messages"
  on public.contact_messages for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete contact messages"
  on public.contact_messages for delete
  using (auth.role() = 'authenticated');

-- ── SEED DATA (matches the original static site content) ─────────────────
insert into public.products (slug, name, description, tags, preview_image_url, buy_url, price_label, sort_order)
values
  ('edge-reflect', 'Edge Reflect', 'A simple preset to stop black borders appearing when tracking footage. Created for TikTok edits.', array['DaVinci (free)', 'Edits', '.setting'], '/media/images/store/edge_reflect/1080x1080.png', 'https://payhip.com/buy?s=1&cart_links%5B%5D=k1u2c&qty%5Bk1u2c%5D=1', 'Free', 0),
  ('halo-blur', 'Halo Blur', 'A simple preset to create a halo blur effect, similar to CapCut. Great for edit transitions.', array['DaVinci (free)', 'Edits', '.drfx'], '/media/images/store/halo_blur/1920x1080.png', 'https://payhip.com/buy?s=1&cart_links%5B%5D=DkQzA&qty%5BDkQzA%5D=1', 'Free', 1),
  ('handbrake-tiktok-1080-quality', 'HandBrake Preset', 'The settings I use to compress the final edit to reduce upload times and minimise TikTok''s compression.', array['HandBrake', 'Edits', '.json'], '/media/images/store/handbrake_tiktok_1080_quality/1920x1080.png', 'https://payhip.com/buy?s=1&cart_links%5B%5D=vwU7j&qty%5BvwU7j%5D=1', 'Free', 2)
on conflict (slug) do nothing;

insert into public.portfolio_clips (title, thumbnail_url, video_url, sort_order)
values
  ('TikTok edit 1', '/media/images/tiktok/clip1.webp', 'https://drive.google.com/file/d/19hms66uuhjAZqoEFvYmg7btb3Xku7rz1/', 0),
  ('TikTok edit 2', '/media/images/tiktok/clip2.webp', 'https://drive.google.com/file/d/1LTuqS4n0Og72fY2FbpwSBmjbz7t7-IZG/', 1),
  ('TikTok edit 3', '/media/images/tiktok/clip3.webp', 'https://drive.google.com/file/d/1U5KJM6V3nt8hARxp0R60BIiJ1sUwd8uC/', 2),
  ('TikTok edit 4', '/media/images/tiktok/clip4.webp', 'https://drive.google.com/file/d/1C6fAmte9Ed9R2QjjfnD2eodTNcObqn3E/', 3),
  ('TikTok edit 5', '/media/images/tiktok/clip5.webp', 'https://drive.google.com/file/d/1YlMdc9chtr4SVSnyQcofyjXmudEKEEu6/', 4),
  ('TikTok edit 6', '/media/images/tiktok/clip6.webp', 'https://drive.google.com/file/d/1OIj_ws1LTWSsIk0sJzA1cW9uEy9bveD0/', 5)
on conflict do nothing;
