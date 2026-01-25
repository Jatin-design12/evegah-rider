-- Local Postgres schema: battery swaps
-- Records battery_in/battery_out per vehicle so we can track battery usage.

create extension if not exists pgcrypto;

create table if not exists public.battery_swaps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  employee_uid text not null,
  employee_email text,

  vehicle_number text not null,
  battery_out text not null,
  battery_in text not null,

  swapped_at timestamptz not null default now(),

  notes text
);

create index if not exists battery_swaps_employee_uid_idx
  on public.battery_swaps (employee_uid);

create index if not exists battery_swaps_vehicle_number_idx
  on public.battery_swaps (vehicle_number);

create index if not exists battery_swaps_swapped_at_idx
  on public.battery_swaps (swapped_at desc);

create index if not exists battery_swaps_battery_in_idx
  on public.battery_swaps (battery_in);

create index if not exists battery_swaps_battery_out_idx
  on public.battery_swaps (battery_out);
