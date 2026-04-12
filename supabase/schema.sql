create table if not exists public.leads (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  email text not null,
  goal text not null,
  status text not null default 'new',
  source text not null default 'website',
  service_interest text not null default '1:1 PT',
  priority smallint not null default 2,
  budget text not null default '',
  notes text not null default '',
  follow_up_calls integer not null default 0,
  consultation_sessions_completed integer not null default 0,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.leads
  add column if not exists status text not null default 'new',
  add column if not exists source text not null default 'website',
  add column if not exists service_interest text not null default '1:1 PT',
  add column if not exists priority smallint not null default 2,
  add column if not exists budget text not null default '',
  add column if not exists notes text not null default '',
  add column if not exists follow_up_calls integer not null default 0,
  add column if not exists consultation_sessions_completed integer not null default 0,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists next_follow_up_at timestamptz;

alter table public.leads enable row level security;

create policy "Service role can manage leads"
on public.leads
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.movement_screenings (
  id bigint generated always as identity primary key,
  name text not null,
  injury text not null default '',
  screening_date date,
  contact text not null default '',
  health text not null default '',
  conducted_by text not null default 'Jazzay Sallah',
  warmup_notes text not null default '',
  overall_notes text not null default '',
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.movement_screenings
  add column if not exists injury text not null default '',
  add column if not exists screening_date date,
  add column if not exists contact text not null default '',
  add column if not exists health text not null default '',
  add column if not exists conducted_by text not null default 'Jazzay Sallah',
  add column if not exists warmup_notes text not null default '',
  add column if not exists overall_notes text not null default '',
  add column if not exists sections jsonb not null default '[]'::jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create or replace function public.set_movement_screenings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_movement_screenings_updated_at on public.movement_screenings;

create trigger set_movement_screenings_updated_at
before update on public.movement_screenings
for each row
execute function public.set_movement_screenings_updated_at();

alter table public.movement_screenings enable row level security;

create policy "Service role can manage movement screenings"
on public.movement_screenings
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.consultation_needs (
  id bigint generated always as identity primary key,
  client_name text not null,
  client_email text not null default '',
  client_phone text not null default '',
  goal text not null default '',
  consultation_date date,
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.consultation_needs
  add column if not exists client_email text not null default '',
  add column if not exists client_phone text not null default '',
  add column if not exists goal text not null default '',
  add column if not exists consultation_date date,
  add column if not exists form_data jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists consultation_needs_client_email_idx
  on public.consultation_needs (client_email);

create index if not exists consultation_needs_client_phone_idx
  on public.consultation_needs (client_phone);

create or replace function public.set_consultation_needs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_consultation_needs_updated_at on public.consultation_needs;

create trigger set_consultation_needs_updated_at
before update on public.consultation_needs
for each row
execute function public.set_consultation_needs_updated_at();

alter table public.consultation_needs enable row level security;

create policy "Service role can manage consultation needs"
on public.consultation_needs
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.pricing_presentations (
  id bigint generated always as identity primary key,
  client_name text not null,
  client_email text not null default '',
  client_phone text not null default '',
  goal text not null default '',
  selected_package_name text not null default '',
  weekly_total numeric not null default 0,
  upfront_total numeric not null default 0,
  nutrition_added boolean not null default false,
  presentation_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.pricing_presentations
  add column if not exists client_email text not null default '',
  add column if not exists client_phone text not null default '',
  add column if not exists goal text not null default '',
  add column if not exists selected_package_name text not null default '',
  add column if not exists weekly_total numeric not null default 0,
  add column if not exists upfront_total numeric not null default 0,
  add column if not exists nutrition_added boolean not null default false,
  add column if not exists presentation_data jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists pricing_presentations_client_email_idx
  on public.pricing_presentations (client_email);

create index if not exists pricing_presentations_client_phone_idx
  on public.pricing_presentations (client_phone);

create or replace function public.set_pricing_presentations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_pricing_presentations_updated_at on public.pricing_presentations;

create trigger set_pricing_presentations_updated_at
before update on public.pricing_presentations
for each row
execute function public.set_pricing_presentations_updated_at();

alter table public.pricing_presentations enable row level security;

drop policy if exists "Service role can manage pricing presentations" on public.pricing_presentations;

create policy "Service role can manage pricing presentations"
on public.pricing_presentations
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

alter table public.pricing_presentations
  add column if not exists decision_status text not null default 'presented',
  add column if not exists accepted_package_name text not null default '',
  add column if not exists follow_up_at timestamptz,
  add column if not exists follow_up_note text not null default '';
