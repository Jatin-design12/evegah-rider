-- Core local Postgres schema: riders, rentals, returns, and uploaded documents
-- Intended for running with psql or via docker-entrypoint-initdb.d

create extension if not exists pgcrypto;

create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  full_name text not null,
  mobile text not null,
  aadhaar text,
  dob date,
  gender text,

  permanent_address text,
  temporary_address text,
  reference text,

  status text not null default 'active',

  meta jsonb not null default '{}'::jsonb
);

create unique index if not exists riders_mobile_uq
  on public.riders (mobile);

create unique index if not exists riders_aadhaar_uq
  on public.riders (aadhaar)
  where aadhaar is not null and aadhaar <> '';

create index if not exists riders_created_at_idx
  on public.riders (created_at desc);

create index if not exists riders_status_idx
  on public.riders (status);

create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  rider_id uuid not null references public.riders(id) on delete cascade,

  start_time timestamptz not null,
  end_time timestamptz,

  rental_package text,
  rental_amount numeric not null default 0,
  deposit_amount numeric not null default 0,
  total_amount numeric not null default 0,
  payment_mode text,

  bike_model text,
  bike_id text,
  battery_id text,
  vehicle_number text,

  accessories jsonb not null default '[]'::jsonb,
  other_accessories text,

  meta jsonb not null default '{}'::jsonb
);

create index if not exists rentals_rider_id_idx
  on public.rentals (rider_id);

create index if not exists rentals_start_time_idx
  on public.rentals (start_time desc);

create index if not exists rentals_active_idx
  on public.rentals (end_time)
  where end_time is null;

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  rental_id uuid not null references public.rentals(id) on delete cascade,
  returned_at timestamptz not null,
  condition_notes text,

  meta jsonb not null default '{}'::jsonb
);

create index if not exists returns_rental_id_idx
  on public.returns (rental_id);

-- Document storage: we store URLs to files saved on the API server
-- kind examples: rider_photo, government_id, rider_signature, pre_ride_photo, return_photo
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  rider_id uuid references public.riders(id) on delete cascade,
  rental_id uuid references public.rentals(id) on delete cascade,
  return_id uuid references public.returns(id) on delete cascade,

  kind text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  url text not null,

  meta jsonb not null default '{}'::jsonb
);

create index if not exists documents_rider_id_idx on public.documents (rider_id);
create index if not exists documents_rental_id_idx on public.documents (rental_id);
create index if not exists documents_return_id_idx on public.documents (return_id);
create index if not exists documents_kind_idx on public.documents (kind);

-- updated_at trigger (shared)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_riders_updated_at on public.riders;
create trigger set_riders_updated_at
before update on public.riders
for each row execute function public.set_updated_at();

drop trigger if exists set_rentals_updated_at on public.rentals;
create trigger set_rentals_updated_at
before update on public.rentals
for each row execute function public.set_updated_at();
