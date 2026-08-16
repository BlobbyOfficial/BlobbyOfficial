-- blobbyofficial: messaging controls for the admin dashboard.
--
-- 0005 shipped the account inbox with exactly two verbs: send, and (admin
-- only) mark read. Everything else an inbox needs — deleting a message you
-- regret, clearing a thread, blocking someone who abuses it, turning
-- messaging off while away — had no home. This migration adds the state
-- those controls need, and enforces the rules that must not live in the UI
-- alone (a Server Action is an addressable endpoint; RLS and triggers are
-- the backstop).
--
-- Everything stays "bo_" prefixed: the Supabase project is shared with
-- another app (see the note in 0005).

-- ── MESSAGE-LEVEL STATE ──────────────────────────────────────────────────
-- Deletion is a soft delete. Both sides can delete, and the row survives so
-- the other side sees a tombstone rather than a thread that silently
-- rewrites itself. `bo_purge_*` below is the hard delete, admin only.
alter table public.bo_messages
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text check (deleted_by in ('user', 'admin')),
  add column if not exists edited_at timestamptz,
  add column if not exists pinned boolean not null default false;

create index if not exists bo_messages_unread_idx
  on public.bo_messages (user_id)
  where read = false and deleted_at is null;

-- Users may now update their own rows (to soft-delete or edit) and hard
-- delete them. The insert policy from 0005 already pins sender = 'user' for
-- them; the update policy below stops them flipping sender or user_id.
drop policy if exists "Users can update their own messages" on public.bo_messages;
create policy "Users can update their own messages"
  on public.bo_messages for update
  to authenticated
  using ((select auth.uid()) = user_id and sender = 'user')
  with check ((select auth.uid()) = user_id and sender = 'user');

drop policy if exists "Users and admin can delete messages" on public.bo_messages;
create policy "Users and admin can delete messages"
  on public.bo_messages for delete
  to authenticated
  using (
    ((select auth.uid()) = user_id and sender = 'user')
    or public.bo_is_admin((select auth.uid()))
  );

-- ── CONVERSATION-LEVEL STATE ─────────────────────────────────────────────
-- One row per user the admin has a thread with. Admin-owned: the note is
-- private, so nothing here is readable by the user it describes.
create table if not exists public.bo_conversations (
  user_id uuid primary key references auth.users (id) on delete cascade,
  pinned boolean not null default false,
  archived boolean not null default false,
  starred boolean not null default false,
  label text not null default '' check (char_length(label) <= 40),
  note text not null default '' check (char_length(note) <= 2000),
  updated_at timestamptz not null default now()
);

alter table public.bo_conversations enable row level security;

drop policy if exists "Admins can manage conversations" on public.bo_conversations;
create policy "Admins can manage conversations"
  on public.bo_conversations for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── BLOCKS ───────────────────────────────────────────────────────────────
-- A block targets an account (user_id) or an address (email). The email form
-- matters because a blocked person can delete their account and sign up
-- again with the same address — the block outlives the account.
create table if not exists public.bo_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text,
  reason text not null default '' check (char_length(reason) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint bo_blocks_target_check check (user_id is not null or email is not null)
);

create unique index if not exists bo_blocks_user_id_key
  on public.bo_blocks (user_id) where user_id is not null;
create unique index if not exists bo_blocks_email_key
  on public.bo_blocks (lower(email)) where email is not null;

alter table public.bo_blocks enable row level security;

drop policy if exists "Admins can manage blocks" on public.bo_blocks;
create policy "Admins can manage blocks"
  on public.bo_blocks for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- Blocked users must be able to learn they're blocked (so the composer can
-- say so instead of failing mysteriously) without being able to read the
-- block list — hence a definer function that only answers about the caller.
create or replace function public.bo_is_blocked(p_user_id uuid, p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bo_blocks
     where (user_id is not null and user_id = p_user_id)
        or (email is not null and p_email is not null and lower(email) = lower(p_email))
  );
$$;

create or replace function public.bo_am_i_blocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.bo_is_blocked(
    auth.uid(),
    (select email from auth.users where id = auth.uid())
  );
$$;

revoke all on function public.bo_is_blocked(uuid, text) from public, anon;
revoke all on function public.bo_am_i_blocked() from public, anon;
grant execute on function public.bo_is_blocked(uuid, text) to authenticated;
grant execute on function public.bo_am_i_blocked() to authenticated;

-- ── MESSAGING SETTINGS ───────────────────────────────────────────────────
-- Single row (id = 1). Readable by everyone signed in so the composer can
-- render the banner and the right max length; writable by admins only.
create table if not exists public.bo_messaging_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default true,
  disabled_notice text not null default 'Messaging is paused right now - check back soon.'
    check (char_length(disabled_notice) <= 500),
  banner text not null default '' check (char_length(banner) <= 500),
  max_length integer not null default 4000 check (max_length between 100 and 4000),
  auto_reply_enabled boolean not null default false,
  auto_reply_body text not null default '' check (char_length(auto_reply_body) <= 2000),
  updated_at timestamptz not null default now()
);

insert into public.bo_messaging_settings (id) values (1) on conflict (id) do nothing;

alter table public.bo_messaging_settings enable row level security;

drop policy if exists "Anyone signed in can read messaging settings"
  on public.bo_messaging_settings;
create policy "Anyone signed in can read messaging settings"
  on public.bo_messaging_settings for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage messaging settings" on public.bo_messaging_settings;
create policy "Admins can manage messaging settings"
  on public.bo_messaging_settings for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── CANNED REPLIES ───────────────────────────────────────────────────────
create table if not exists public.bo_message_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 4000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.bo_message_templates enable row level security;

drop policy if exists "Admins can manage message templates" on public.bo_message_templates;
create policy "Admins can manage message templates"
  on public.bo_message_templates for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── ENFORCEMENT ──────────────────────────────────────────────────────────
-- Blocks and the global off-switch are checked in the Server Action for a
-- readable error, and again here so neither can be bypassed by talking to
-- PostgREST directly with the anon key. Admin replies are exempt: the admin
-- can still answer a thread they've blocked (e.g. to explain why).
create or replace function public.bo_messages_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.bo_messaging_settings%rowtype;
begin
  if new.sender <> 'user' then
    return new;
  end if;

  if public.bo_is_blocked(new.user_id, new.user_email) then
    raise exception 'blocked: this account can no longer send messages'
      using errcode = '42501';
  end if;

  select * into v_settings from public.bo_messaging_settings where id = 1;
  if found then
    if not v_settings.enabled then
      raise exception 'messaging_disabled: messaging is paused'
        using errcode = '42501';
    end if;
    if char_length(new.body) > v_settings.max_length then
      raise exception 'too_long: message exceeds the current limit of % characters',
        v_settings.max_length
        using errcode = '22001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists bo_messages_guard_trigger on public.bo_messages;
create trigger bo_messages_guard_trigger
  before insert on public.bo_messages
  for each row execute function public.bo_messages_guard();

-- ── ADMIN BULK OPERATIONS ────────────────────────────────────────────────
-- Hard deletes. Soft delete is the default everywhere in the UI; these are
-- the "actually remove it" escape hatch, and they refuse non-admins even
-- though RLS would already allow the admin case, so a mis-granted execute
-- can't turn into a data-loss path.
create or replace function public.bo_purge_conversation(p_user_id uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.bo_is_admin(auth.uid()) then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  delete from public.bo_messages where user_id = p_user_id;
  get diagnostics v_count = row_count;
  delete from public.bo_conversations where user_id = p_user_id;
  return v_count;
end;
$$;

-- Deletes messages soft-deleted longer ago than p_days (0 = every tombstone).
create or replace function public.bo_purge_deleted(p_days integer default 0)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.bo_is_admin(auth.uid()) then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  delete from public.bo_messages
   where deleted_at is not null
     and deleted_at < now() - make_interval(days => greatest(p_days, 0));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.bo_purge_conversation(uuid) from public, anon;
revoke all on function public.bo_purge_deleted(integer) from public, anon;
grant execute on function public.bo_purge_conversation(uuid) to authenticated;
grant execute on function public.bo_purge_deleted(integer) to authenticated;
