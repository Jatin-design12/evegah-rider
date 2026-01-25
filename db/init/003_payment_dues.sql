-- Local Postgres schema: rider payment dues
-- Stores pending dues per rider so employees can track who needs to pay.

create extension if not exists pgcrypto;

create table if not exists public.payment_dues (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  employee_uid text not null,
  employee_email text,

  rider_name text,
  rider_phone text,

  amount_due numeric(12,2) not null default 0,
  due_date date,

  status text not null default 'due',
  notes text
);

create index if not exists payment_dues_employee_uid_idx
  on public.payment_dues (employee_uid);

create index if not exists payment_dues_status_idx
  on public.payment_dues (status);

create index if not exists payment_dues_due_date_idx
  on public.payment_dues (due_date);

create index if not exists payment_dues_updated_at_idx
  on public.payment_dues (updated_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_payment_dues_updated_at on public.payment_dues;
create trigger set_payment_dues_updated_at
before update on public.payment_dues
for each row execute function public.set_updated_at();
