-- AI World Atlas — esquema propuesto para estadísticas agregadas, likes y chat.
-- No almacena ni expone IPs, ubicación precisa ni identificadores internos en vistas públicas.

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
create index if not exists idx_chat_messages_visitor_created on public.chat_messages(visitor_id,created_at desc);

alter table public.visitor_sessions enable row level security;
alter table public.site_likes enable row level security;
alter table public.chat_messages enable row level security;

-- Reaplicar políticas de forma idempotente.
drop policy if exists "public insert likes" on public.site_likes;
drop policy if exists "public insert chat" on public.chat_messages;

-- El navegador puede registrar un like, pero no leer los identificadores de otros visitantes.
create policy "public insert likes" on public.site_likes for insert to anon with check (true);

-- El navegador puede enviar chat; la lectura pública se hace mediante una vista sin visitor_id.
create policy "public insert chat" on public.chat_messages for insert to anon with check (
  char_length(alias) between 1 and 24 and char_length(message) between 1 and 500
);

-- Control simple anti-spam: un mensaje cada 3 segundos por visitor_id.
create or replace function public.limit_chat_rate()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if exists (
    select 1 from public.chat_messages
    where visitor_id=new.visitor_id
      and created_at > now() - interval '3 seconds'
  ) then
    raise exception 'rate_limited';
  end if;
  new.alias := left(trim(new.alias),24);
  new.message := left(trim(new.message),500);
  return new;
end;
$$;

drop trigger if exists trg_limit_chat_rate on public.chat_messages;
create trigger trg_limit_chat_rate
before insert on public.chat_messages
for each row execute function public.limit_chat_rate();

-- Vistas públicas: solo agregados o campos no sensibles.
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
), total as (select greatest(coalesce(sum(n),0),1) as n from counts)
select counts.continent, round((counts.n / total.n) * 100, 1) as percentage
from counts cross join total
order by counts.n desc;

create or replace view public.public_chat_messages as
select alias,message,created_at
from public.chat_messages
where created_at > now() - interval '7 days'
order by created_at desc;

revoke all on public.visitor_sessions from anon;
revoke all on public.site_likes from anon;
revoke all on public.chat_messages from anon;
grant insert on public.site_likes to anon;
grant insert on public.chat_messages to anon;
grant select on public.public_stats to anon;
grant select on public.continent_stats to anon;
grant select on public.public_chat_messages to anon;

-- Limpieza recomendada: una tarea programada puede borrar chat_messages con más de 7 días.
