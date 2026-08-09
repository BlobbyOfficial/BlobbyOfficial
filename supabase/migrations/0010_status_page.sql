-- blobbyofficial: the status page served at status.blobbyofficial.com.
--
-- Three tables, all prefixed "bo_" like everything else this app owns (see
-- the note at the top of 0005 — the Supabase project is shared):
--
--   bo_status_services  one row per checked thing ("Site", "Games", ...),
--                       grouped by the domain it belongs to.
--   bo_status_checks    the ping history the coloured squares are drawn from.
--   bo_status_reports   visitor-submitted "this is broken" reports.
--
-- The state a visitor sees lives on the service row rather than being derived
-- at read time, because three different things can set it: the cron pinger,
-- the report threshold, and the admin. `state_source` records which, and is
-- what stops the pinger from stomping on a state the admin set by hand.

-- ── SERVICES ─────────────────────────────────────────────────────────────
create table if not exists public.bo_status_services (
  id uuid primary key default gen_random_uuid(),
  -- The heading a service is listed under: "blobbyofficial.com".
  group_key text not null,
  group_label text not null,
  group_url text,
  group_order integer not null default 0,
  -- The row's own label: "Site", "Video previews", "Contact".
  name text not null,
  -- Absolute URL the cron route pings. Null means "state is set by hand only"
  -- — useful for things that aren't a plain HTTP endpoint.
  check_url text,
  sort_order integer not null default 0,
  state text not null default 'up'
    check (state in ('up', 'degraded', 'down', 'investigating')),
  -- 'auto'    — owned by the cron pinger, overwritten on every check.
  -- 'reports' — escalated by the report threshold below.
  -- 'manual'  — set by the admin; neither of the above may touch it.
  state_source text not null default 'auto'
    check (state_source in ('auto', 'reports', 'manual')),
  -- Maintained by the trigger below so the public page can show the report
  -- count without being allowed to read the reports themselves.
  open_reports integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bo_status_services_order_idx
  on public.bo_status_services (group_order, group_key, sort_order);

alter table public.bo_status_services enable row level security;

drop policy if exists "Anyone can read published services" on public.bo_status_services;
create policy "Anyone can read published services"
  on public.bo_status_services for select
  using (published);

drop policy if exists "Admins can manage services" on public.bo_status_services;
create policy "Admins can manage services"
  on public.bo_status_services for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── CHECK HISTORY ────────────────────────────────────────────────────────
create table if not exists public.bo_status_checks (
  id bigint generated always as identity primary key,
  service_id uuid not null references public.bo_status_services (id) on delete cascade,
  state text not null check (state in ('up', 'degraded', 'down')),
  status_code integer,
  latency_ms integer,
  checked_at timestamptz not null default now()
);

create index if not exists bo_status_checks_service_time_idx
  on public.bo_status_checks (service_id, checked_at desc);

alter table public.bo_status_checks enable row level security;

-- Read-only to the world; writes come from the cron route, which uses the
-- service-role key and bypasses RLS entirely.
drop policy if exists "Anyone can read check history" on public.bo_status_checks;
create policy "Anyone can read check history"
  on public.bo_status_checks for select
  using (true);

drop policy if exists "Admins can manage check history" on public.bo_status_checks;
create policy "Admins can manage check history"
  on public.bo_status_checks for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── OUTAGE REPORTS ───────────────────────────────────────────────────────
create table if not exists public.bo_status_reports (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.bo_status_services (id) on delete cascade,
  detail text check (detail is null or char_length(detail) between 1 and 500),
  -- Salted hash of the reporter's IP. Never the IP itself: the only thing
  -- this needs to answer is "have I already counted this person?".
  reporter_hash text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- One open report per person per service, so a single visitor refreshing the
-- form can't manufacture the two reports that trigger an investigation.
create unique index if not exists bo_status_reports_one_open_per_reporter
  on public.bo_status_reports (service_id, reporter_hash)
  where not resolved;

create index if not exists bo_status_reports_service_idx
  on public.bo_status_reports (service_id, created_at desc);

alter table public.bo_status_reports enable row level security;

-- Anyone can file a report — that's the point of the button, and the page is
-- public. Nobody but the admin can read them back: they carry free text and
-- a per-reporter hash.
drop policy if exists "Anyone can file a report" on public.bo_status_reports;
create policy "Anyone can file a report"
  on public.bo_status_reports for insert
  with check (
    not resolved
    and exists (
      select 1 from public.bo_status_services s
      where s.id = service_id and s.published
    )
  );

drop policy if exists "Admins can manage reports" on public.bo_status_reports;
create policy "Admins can manage reports"
  on public.bo_status_reports for all
  to authenticated
  using (public.bo_is_admin((select auth.uid())))
  with check (public.bo_is_admin((select auth.uid())));

-- ── REPORT THRESHOLD ─────────────────────────────────────────────────────
-- Two or more open reports on a service that currently looks fine flips it to
-- "investigating" (the orange state). This lives in a trigger rather than in
-- the server action because the anon key can't be allowed to write
-- bo_status_services directly — otherwise anyone could mark anything down.
create or replace function public.bo_status_apply_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.service_id, old.service_id);
  open_count integer;
begin
  select count(*) into open_count
  from public.bo_status_reports
  where service_id = target and not resolved;

  update public.bo_status_services s
  set open_reports = open_count,
      -- Escalate on the threshold, and stand back down when the reports are
      -- cleared. A state the admin set by hand ('manual') is never touched,
      -- and neither is a service the pinger already knows is down.
      state = case
        when s.state_source = 'manual' then s.state
        when open_count >= 2 and s.state = 'up' then 'investigating'
        when open_count < 2 and s.state_source = 'reports' then 'up'
        else s.state
      end,
      state_source = case
        when s.state_source = 'manual' then s.state_source
        when open_count >= 2 and s.state = 'up' then 'reports'
        when open_count < 2 and s.state_source = 'reports' then 'auto'
        else s.state_source
      end,
      updated_at = now()
  where s.id = target;

  return null;
end;
$$;

drop trigger if exists bo_status_reports_apply on public.bo_status_reports;
create trigger bo_status_reports_apply
  after insert or update or delete on public.bo_status_reports
  for each row execute function public.bo_status_apply_reports();

-- ── SEED ─────────────────────────────────────────────────────────────────
-- Mirrors the defaults in src/lib/status.ts, which is what the page falls
-- back to when Supabase isn't configured. Add or rename services from
-- /admin/status once this has run.
insert into public.bo_status_services
  (group_key, group_label, group_url, group_order, name, check_url, sort_order)
values
  ('blobbyofficial', 'blobbyofficial.com', 'https://blobbyofficial.com', 0,
   'Site', 'https://blobbyofficial.com/', 0),
  ('blobbyofficial', 'blobbyofficial.com', 'https://blobbyofficial.com', 0,
   'Video previews', 'https://blobbyofficial.com/portfolio', 1),
  ('blobbyofficial', 'blobbyofficial.com', 'https://blobbyofficial.com', 0,
   'Contact', 'https://blobbyofficial.com/contact', 2),
  ('blobbyofficial', 'blobbyofficial.com', 'https://blobbyofficial.com', 0,
   'Store', 'https://blobbyofficial.com/store', 3),
  ('classic-games-hub', 'classic-games-hub.blobbyofficial.com',
   'https://classic-games-hub.blobbyofficial.com', 1,
   'Site', 'https://classic-games-hub.blobbyofficial.com/', 0)
on conflict do nothing;
