-- blobbyofficial: per-category visibility toggle for the portfolio grid
-- (e.g. hide the "clients" section without deleting/unpublishing every clip).

create table if not exists public.portfolio_section_visibility (
  category text primary key check (category in ('tiktok', 'clients')),
  hidden boolean not null default false
);

insert into public.portfolio_section_visibility (category, hidden)
values ('tiktok', false), ('clients', false)
on conflict (category) do nothing;

alter table public.portfolio_section_visibility enable row level security;

create policy "Public can read portfolio section visibility"
  on public.portfolio_section_visibility for select
  using (true);

create policy "Authenticated users can manage portfolio section visibility"
  on public.portfolio_section_visibility for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
