-- AI World Atlas — esquema propuesto para estadísticas agregadas, likes y chat.
-- No almacena IP pública en tablas de aplicación.

create extension if not exists pgcrypto;

create table if not exists public.visitor_sessions (
  visitor_id uuid primary key,
  continent text not null default 'Desconocido',
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  visit_day date not null default current_date
);

create table if not exists public.site_likes (
  visitor_id uuid primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  alias text not null check (char_length(alias) between 1 and 24),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_visitor_sessions_last_seen on public.visitor_sessions(last_seen);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at desc);

alter table public.visitor_sessions enable row level security;
alter table public.site_likes enable row level security;
alter table public.chat_messages enable row level security;

-- El navegador no escribe visitor_sessions directamente: se usa la Edge Function atlas-visit.
-- Likes: se permite insertar una sola fila por visitor_id generado localmente.
create policy if not exists "public insert likes" on public.site_likes for insert to anon with check (true);
create policy if not exists "public read likes" on public.site_likes for select to anon using (true);

-- Chat público: lectura e inserción controladas por validaciones de longitud.
create policy if not exists "public read chat" on public.chat_messages for select to anon using (true);
create policy if not exists "public insert chat" on public.chat_messages for insert to anon with check (char_length(alias) between 1 and 24 and char_length(message) between 1 and 500);

create or replace view public.public_stats as
select
  (select count(*) from public.visitor_sessions) as visitors_total,
  (select count(*) from public.visitor_sessions where last_seen > now() - interval '2 minutes') as visitors_online,
  (select count(*) from public.site_likes) as likes_total;

create or replace view public.continent_stats as
with counts as (
  select continent, count(*)::numeric as n
  from public.visitor_sessions
  group by continent
), total as (select greatest(sum(n),1) as n from counts)
select counts.continent, round((counts.n / total.n) * 100, 1) as percentage
from counts cross join total
order by counts.n desc;

grant select on public.public_stats to anon;
grant select on public.continent_stats to anon;
grant select, insert on public.site_likes to anon;
grant select, insert on public.chat_messages to anon;

-- Limpieza recomendada para chat: conservar solo los últimos 7 días mediante una tarea programada.
