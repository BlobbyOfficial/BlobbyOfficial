-- blobbyofficial: split portfolio clips into "tiktok" (own work) and "clients"
-- (edits for others), and drop the unused thumbnail column now that clips
-- render as embedded previews instead of thumbnail links.

alter table public.portfolio_clips
  add column if not exists category text not null default 'tiktok';

alter table public.portfolio_clips
  add constraint portfolio_clips_category_check check (category in ('tiktok', 'clients'));

alter table public.portfolio_clips
  drop column if exists thumbnail_url;
