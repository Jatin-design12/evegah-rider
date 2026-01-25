-- Stores every incoming payment notification so ops can reconcile manually.
create table if not exists public.payment_notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  reference text,
  transaction_id text,
  status text,
  status_message text,
  amount numeric(12,2),
  payment_method text,
  signature text,

  headers jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  raw_body text,

  rental_id uuid references public.rentals(id) on delete set null,
  payment_due_id uuid references public.payment_dues(id) on delete set null,

  meta jsonb not null default '{}'::jsonb
);

create index if not exists payment_notifications_reference_idx
  on public.payment_notifications (reference);

create index if not exists payment_notifications_transaction_idx
  on public.payment_notifications (transaction_id);

create index if not exists payment_notifications_created_at_idx
  on public.payment_notifications (created_at desc);

drop trigger if exists set_payment_notifications_updated_at on public.payment_notifications;
create trigger set_payment_notifications_updated_at
before update on public.payment_notifications
for each row execute function public.set_updated_at();
