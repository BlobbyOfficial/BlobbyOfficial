-- blobbyofficial: public user accounts + an authenticated messaging inbox.
--
-- NOTE: this Supabase project is shared with another app that already has
-- tables named "profiles" and "messages" with a completely different shape
-- (and its own auth.users signup trigger). To never collide with that
-- schema, every table/function this app owns is prefixed "bo_".

-- ── ADMIN MARKER ─────────────────────────────────────────────────────────
-- Membership in this table (not "any signed-in user") is what gates /admin.
create table if not exists public.bo_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.bo_admins enable row level security;

drop policy if exists "Users can check their own admin membership" on public.bo_admins;
create policy "Users can check their own admin membership"
  on public.bo_admins for select
  using (auth.uid() = user_id);

create or replace function public.bo_is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.bo_admins where user_id = uid);
$$;

-- ── MESSAGES (authenticated inbox, replaces the anonymous contact form) ───
create table if not exists public.bo_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text not null,
  sender text not null check (sender in ('user', 'admin')),
  body text not null check (char_length(body) between 1 and 4000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists bo_messages_user_id_created_at_idx
  on public.bo_messages (user_id, created_at);

alter table public.bo_messages enable row level security;

drop policy if exists "Users and admin can view a conversation" on public.bo_messages;
create policy "Users and admin can view a conversation"
  on public.bo_messages for select
  using (auth.uid() = user_id or public.bo_is_admin(auth.uid()));

drop policy if exists "Users and admin can send messages" on public.bo_messages;
create policy "Users and admin can send messages"
  on public.bo_messages for insert
  with check (
    (auth.uid() = user_id and sender = 'user')
    or (public.bo_is_admin(auth.uid()) and sender = 'admin')
  );

drop policy if exists "Admin can update messages" on public.bo_messages;
create policy "Admin can update messages"
  on public.bo_messages for update
  using (public.bo_is_admin(auth.uid()))
  with check (public.bo_is_admin(auth.uid()));
