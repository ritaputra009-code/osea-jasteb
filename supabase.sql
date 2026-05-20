create table if not exists public.products (
  id text primary key,
  nama text not null,
  harga integer not null check (harga > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  trx_id text primary key,
  pay_code text unique,
  kode_unik integer not null,
  email text not null,
  result text not null,
  harga integer not null,
  total integer not null,
  status text not null default 'pending',
  expired bigint not null,
  tanggal text not null,
  waktu_bayar text,
  paid_time bigint,
  token text,
  unik text unique,
  created_at timestamptz not null default now(),
  constraint transactions_status_check check (status in ('pending', 'sukses', 'expired'))
);

alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.transactions add column if not exists created_at timestamptz not null default now();
alter table public.transactions add column if not exists pay_code text;
alter table public.transactions add column if not exists waktu_bayar text;

create index if not exists transactions_status_total_idx
on public.transactions (status, total);

create unique index if not exists transactions_pay_code_unique_idx
on public.transactions (pay_code);

create table if not exists public.webhook_logs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  amount integer,
  response text,
  trx_id text,
  raw text,
  payload jsonb
);

alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.webhook_logs enable row level security;

insert into public.products (id, nama, harga) values
('p100', '100', 1000),
('p200', '200', 2000),
('p300', '300', 3000),
('p400', '400', 4000),
('p500', '500', 5000),
('p600', '600', 6000),
('p700', '700', 7000),
('p800', '800', 8000),
('p900', '900', 9000),
('p1000', '1000', 10000)
on conflict (id) do update set
  nama = excluded.nama,
  harga = excluded.harga;
