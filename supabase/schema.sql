-- AI World Atlas — backend dedicado para estadísticas, likes y chat.
-- Las tablas no se exponen directamente al navegador. El acceso público pasa por Edge Functions.

create extension if not exists pgcrypto;
create schema if not exists private;

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

-- No existen políticas públicas: atlas-visit y atlas-community usan la service role dentro del servidor.
drop policy if exists "public insert likes" on public.site_likes;
drop policy if exists "public insert chat" on public.chat_messages;
revoke all on public.visitor_sessions from anon, authenticated;
revoke all on public.site_likes from anon, authenticated;
revoke all on public.chat_messages from anon, authenticated;

-- Anti-spam del chat. Se mantiene fuera del esquema público expuesto por PostgREST.
create or replace function private.limit_chat_rate()
returns trigger
language plpgsql
security definer
set search_path=public,private
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

revoke all on function private.limit_chat_rate() from public, anon, authenticated;

drop trigger if exists trg_limit_chat_rate on public.chat_messages;
create trigger trg_limit_chat_rate
before insert on public.chat_messages
for each row execute function private.limit_chat_rate();

-- Las Edge Functions devuelven únicamente estadísticas agregadas y chat sin visitor_id.
-- No se almacenan ni se publican IPs o ubicaciones precisas.
