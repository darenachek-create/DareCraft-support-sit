-- 1. Создаём таблицу обращений для DareCraft
create table if not exists public.reports (
  id text primary key,
  author text not null,
  category text not null,
  version text not null,
  platform text not null,
  description text not null,
  steps text default '',
  status text default 'Новое обращение',
  votes int default 1,
  created_at timestamptz default now()
);

-- 2. Включаем Row Level Security и разрешаем чтение, добавление и обновление счётчика голосов
alter table public.reports enable row level security;

drop policy if exists "Allow public read reports" on public.reports;
create policy "Allow public read reports"
  on public.reports for select
  to anon
  using (true);

drop policy if exists "Allow public insert reports" on public.reports;
create policy "Allow public insert reports"
  on public.reports for insert
  to anon
  with check (true);

drop policy if exists "Allow public update votes" on public.reports;
create policy "Allow public update votes"
  on public.reports for update
  to anon
  using (true)
  with check (true);
