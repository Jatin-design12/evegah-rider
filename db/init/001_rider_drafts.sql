-- Local Postgres schema: rider drafts
-- Intended for running with psql or via docker-entrypoint-initdb.d

-- Provides gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists public.rider_drafts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  employee_uid text not null,
  employee_email text,

  name text,
  phone text,
  step_label text,
  step_path text not null default 'step-1',

  meta jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb
);

create index if not exists rider_drafts_employee_uid_idx
  on public.rider_drafts (employee_uid);

create index if not exists rider_drafts_updated_at_idx
  on public.rider_drafts (updated_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_rider_drafts_updated_at on public.rider_drafts;
create trigger set_rider_drafts_updated_at
before update on public.rider_drafts
for each row execute function public.set_updated_at();
