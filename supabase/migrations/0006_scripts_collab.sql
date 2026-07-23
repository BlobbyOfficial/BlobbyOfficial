-- blobbyofficial: real-time collaborative script editor (Google Docs-style).
-- Content is stored as a base64-encoded Yjs CRDT snapshot so concurrent
-- editors merge without clobbering each other; live edits sync over a
-- Supabase Realtime broadcast channel and are periodically persisted here.
--
-- Table is prefixed "bo_" — see 0005 for why (shared Supabase project).

create table if not exists public.bo_scripts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled script',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bo_scripts_owner_id_idx on public.bo_scripts (owner_id);

alter table public.bo_scripts enable row level security;

-- Anyone signed in can open a script if they have the link (matches
-- "anyone with the link can edit" sharing, same as Google Docs' default) —
-- the "My scripts" list itself only ever queries the caller's own rows.
drop policy if exists "Authenticated users can view scripts" on public.bo_scripts;
create policy "Authenticated users can view scripts"
  on public.bo_scripts for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can create their own scripts" on public.bo_scripts;
create policy "Authenticated users can create their own scripts"
  on public.bo_scripts for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Authenticated users can edit scripts" on public.bo_scripts;
create policy "Authenticated users can edit scripts"
  on public.bo_scripts for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Owner can delete their script" on public.bo_scripts;
create policy "Owner can delete their script"
  on public.bo_scripts for delete
  using (auth.uid() = owner_id);
