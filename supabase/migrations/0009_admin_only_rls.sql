-- blobbyofficial: tighten row-level security to admins only.
--
-- 0001 shipped when the only account in the project was the admin's, so
-- "manage" policies were gated on auth.role() = 'authenticated'. 0005 then
-- opened public signup (/signup) for the messaging inbox and script editor,
-- which silently turned every visitor-created account into a content editor:
-- anyone who signed up could insert/update/delete products and portfolio
-- clips, toggle section visibility, and read every legacy contact message —
-- straight from the public anon key, no dashboard needed.
--
-- Membership in bo_admins (see 0005) is the only thing that should grant
-- write access, so every policy below now calls public.bo_is_admin().
--
-- auth.uid() is wrapped in a scalar subquery so Postgres evaluates it once
-- per statement instead of once per row, and the admin policies are scoped
-- `to authenticated` so anonymous reads never evaluate them at all.

-- ── PRODUCTS ─────────────────────────────────────────────────────────────
drop policy if exists "Authenticated users can manage products" on public.products;

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── PORTFOLIO CLIPS ──────────────────────────────────────────────────────
drop policy if exists "Authenticated users can manage portfolio clips" on public.portfolio_clips;

drop policy if exists "Admins can manage portfolio clips" on public.portfolio_clips;
create policy "Admins can manage portfolio clips"
  on public.portfolio_clips for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── PORTFOLIO SECTION VISIBILITY ─────────────────────────────────────────
drop policy if exists "Authenticated users can manage portfolio section visibility"
  on public.portfolio_section_visibility;

drop policy if exists "Admins can manage portfolio section visibility"
  on public.portfolio_section_visibility;
create policy "Admins can manage portfolio section visibility"
  on public.portfolio_section_visibility for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── CONTACT MESSAGES (legacy) ────────────────────────────────────────────
-- The anonymous contact form was replaced by the account-based inbox in
-- 0005, so nothing writes here any more: drop the open insert policy rather
-- than leave an unauthenticated write path into the table, and restrict the
-- remaining rows (real names, emails and message bodies) to admins.
drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
drop policy if exists "Authenticated users can read contact messages" on public.contact_messages;
drop policy if exists "Authenticated users can update contact messages" on public.contact_messages;
drop policy if exists "Authenticated users can delete contact messages" on public.contact_messages;

drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can manage contact messages"
  on public.contact_messages for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── SCRIPTS ──────────────────────────────────────────────────────────────
-- 0006 granted every authenticated user select/update on bo_scripts so that
-- "anyone with the link can edit" would work. But RLS can't tell "has the
-- link" from "ran select * on the table", so that also let any account read
-- and rewrite everybody's scripts.
--
-- The base table is now owner-only (plus admin). Link sharing is preserved
-- through the security-definer functions below: they require the caller to
-- already know the script's uuid, which is exactly what "having the link"
-- means, and there is no way to list rows you weren't given.
drop policy if exists "Authenticated users can view scripts" on public.bo_scripts;
drop policy if exists "Authenticated users can edit scripts" on public.bo_scripts;
drop policy if exists "Authenticated users can create their own scripts" on public.bo_scripts;
drop policy if exists "Owner can delete their script" on public.bo_scripts;

create policy "Owners can read their own scripts"
  on public.bo_scripts for select
  to authenticated
  using ((select auth.uid()) = owner_id or public.bo_is_admin((select auth.uid())));

create policy "Owners can create their own scripts"
  on public.bo_scripts for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owners can update their own scripts"
  on public.bo_scripts for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their own scripts"
  on public.bo_scripts for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- Fetch one script by id. Knowing the uuid is the share credential; the
-- function never accepts a filter, so it can't be used to enumerate.
create or replace function public.bo_script_get(p_id uuid)
returns setof public.bo_scripts
language sql
stable
security definer
set search_path = public
as $$
  select * from public.bo_scripts where id = p_id;
$$;

-- Persist a Yjs snapshot for a script the caller has the link to.
create or replace function public.bo_script_save(p_id uuid, p_content text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.bo_scripts
     set content = p_content,
         updated_at = now()
   where id = p_id;
$$;

-- Rename a script the caller has the link to (collaborators are editors).
create or replace function public.bo_script_rename(p_id uuid, p_title text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.bo_scripts
     set title = coalesce(nullif(btrim(p_title), ''), 'Untitled script'),
         updated_at = now()
   where id = p_id;
$$;

-- Collaborators are editors, not owners: deleting stays owner-only and is
-- left to the table's RLS policy above, deliberately without a definer
-- function to route around it.
revoke all on function public.bo_script_get(uuid) from public, anon;
revoke all on function public.bo_script_save(uuid, text) from public, anon;
revoke all on function public.bo_script_rename(uuid, text) from public, anon;

grant execute on function public.bo_script_get(uuid) to authenticated;
grant execute on function public.bo_script_save(uuid, text) to authenticated;
grant execute on function public.bo_script_rename(uuid, text) to authenticated;
