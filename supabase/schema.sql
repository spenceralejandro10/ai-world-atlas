-- AI World Atlas — backend dedicado para estadísticas, likes, chat y debates.
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
  gender text not null default 'anon' check (gender in ('boy','girl','anon')),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.forum_topics (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  alias text not null check (char_length(alias) between 1 and 24),
  gender text not null default 'anon' check (gender in ('boy','girl','anon')),
  title text not null check (char_length(title) between 1 and 100),
  body text not null check (char_length(body) between 1 and 600),
  created_at timestamptz not null default now()
);

create table if not exists public.forum_replies (
  id bigint generated always as identity primary key,
  topic_id bigint not null references public.forum_topics(id) on delete cascade,
  visitor_id uuid not null,
  alias text not null check (char_length(alias) between 1 and 24),
  gender text not null default 'anon' check (gender in ('boy','girl','anon')),
  message text not null check (char_length(message) between 1 and 400),
  created_at timestamptz not null default now()
);

create table if not exists public.content_reports (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  content_type text not null check (content_type in ('chat','topic','reply')),
  content_id bigint not null,
  reason text not null default 'Contenido reportado' check (char_length(reason) between 1 and 120),
  created_at timestamptz not null default now(),
  unique(visitor_id,content_type,content_id)
);

alter table public.chat_messages add column if not exists gender text not null default 'anon';

create index if not exists idx_visitor_sessions_last_seen on public.visitor_sessions(last_seen);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at desc);
create index if not exists idx_chat_messages_visitor_created on public.chat_messages(visitor_id,created_at desc);
create index if not exists idx_forum_topics_created_at on public.forum_topics(created_at desc);
create index if not exists idx_forum_topics_visitor_created on public.forum_topics(visitor_id,created_at desc);
create index if not exists idx_forum_replies_topic_created on public.forum_replies(topic_id,created_at asc);
create index if not exists idx_forum_replies_visitor_created on public.forum_replies(visitor_id,created_at desc);
create index if not exists idx_content_reports_target on public.content_reports(content_type,content_id);

alter table public.visitor_sessions enable row level security;
alter table public.site_likes enable row level security;
alter table public.chat_messages enable row level security;
alter table public.forum_topics enable row level security;
alter table public.forum_replies enable row level security;
alter table public.content_reports enable row level security;

-- Sin políticas públicas: las Edge Functions usan service role únicamente dentro del servidor.
drop policy if exists "public insert likes" on public.site_likes;
drop policy if exists "public insert chat" on public.chat_messages;
revoke all on public.visitor_sessions from anon, authenticated;
revoke all on public.site_likes from anon, authenticated;
revoke all on public.chat_messages from anon, authenticated;
revoke all on public.forum_topics from anon, authenticated;
revoke all on public.forum_replies from anon, authenticated;
revoke all on public.content_reports from anon, authenticated;

-- Anti-spam del chat: 1 mensaje / 3 s y máximo 8 / min por visitor_id.
create or replace function private.limit_chat_rate()
returns trigger
language plpgsql
security definer
set search_path=public,private
as $$
begin
  if exists (
    select 1 from public.chat_messages
    where visitor_id=new.visitor_id and created_at > now() - interval '3 seconds'
  ) or (
    select count(*) from public.chat_messages
    where visitor_id=new.visitor_id and created_at > now() - interval '1 minute'
  ) >= 8 then
    raise exception 'rate_limited';
  end if;
  new.alias := left(trim(new.alias),24);
  new.message := left(trim(new.message),500);
  return new;
end;
$$;
revoke all on function private.limit_chat_rate() from public, anon, authenticated;
drop trigger if exists trg_limit_chat_rate on public.chat_messages;
create trigger trg_limit_chat_rate before insert on public.chat_messages for each row execute function private.limit_chat_rate();

-- Debates: máximo 1 cada 20 s y 4 cada 10 min.
create or replace function private.limit_forum_topic_rate()
returns trigger
language plpgsql
security definer
set search_path=public,private
as $$
begin
  if exists (
    select 1 from public.forum_topics
    where visitor_id=new.visitor_id and created_at > now() - interval '20 seconds'
  ) or (
    select count(*) from public.forum_topics
    where visitor_id=new.visitor_id and created_at > now() - interval '10 minutes'
  ) >= 4 then
    raise exception 'rate_limited';
  end if;
  new.alias := left(trim(new.alias),24);
  new.title := left(trim(new.title),100);
  new.body := left(trim(new.body),600);
  return new;
end;
$$;
revoke all on function private.limit_forum_topic_rate() from public, anon, authenticated;
drop trigger if exists trg_limit_forum_topic_rate on public.forum_topics;
create trigger trg_limit_forum_topic_rate before insert on public.forum_topics for each row execute function private.limit_forum_topic_rate();

-- Respuestas: máximo 1 cada 5 s y 15 cada 10 min.
create or replace function private.limit_forum_reply_rate()
returns trigger
language plpgsql
security definer
set search_path=public,private
as $$
begin
  if exists (
    select 1 from public.forum_replies
    where visitor_id=new.visitor_id and created_at > now() - interval '5 seconds'
  ) or (
    select count(*) from public.forum_replies
    where visitor_id=new.visitor_id and created_at > now() - interval '10 minutes'
  ) >= 15 then
    raise exception 'rate_limited';
  end if;
  new.alias := left(trim(new.alias),24);
  new.message := left(trim(new.message),400);
  return new;
end;
$$;
revoke all on function private.limit_forum_reply_rate() from public, anon, authenticated;
drop trigger if exists trg_limit_forum_reply_rate on public.forum_replies;
create trigger trg_limit_forum_reply_rate before insert on public.forum_replies for each row execute function private.limit_forum_reply_rate();

-- El historial se conserva. Las Edge Functions no devuelven visitor_id.
-- No se almacenan ni se publican IPs o ubicaciones precisas.
