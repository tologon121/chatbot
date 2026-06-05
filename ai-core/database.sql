-- =============================================================================
-- Nexus AI — Supabase schema bootstrap (v1.2)
-- Run this in Supabase SQL Editor ONE TIME.
-- Если у вас уже создана старая схема (с uuid widget_id), см. migration.sql.
-- =============================================================================

-- 1. pgvector
create extension if not exists vector;

-- 2. Widget — public widget configuration
--    id           — текстовый идентификатор (wk_xxx, usr_xxx, …) — гибкий формат
--    isActive     — флаг включения
--    allowedDomains — массив доменов (для проверки Origin)
--    persona      — кастомный системный промт ("ты — бот компании X...")
--    greeting     — приветствие, которое отдает /chat/session
create table if not exists "Widget" (
  id              text primary key,
  "ownerId"       uuid,
  name            text not null,
  color           text default '#4f46e5',
  language        text default 'RU',
  position        text default 'bottom-right',
  "isActive"      boolean not null default true,
  "allowedDomains" text[] not null default '{}',
  persona         text,
  greeting        text,
  "leadMode"      boolean not null default false,
  "webhookUrl"    text,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);

create index if not exists idx_widget_owner on "Widget" ("ownerId");

-- 3. Document & DocumentChunk (knowledge base)
create table if not exists "Document" (
  id          uuid primary key,
  "widgetId"  text not null references "Widget"(id) on delete cascade,
  title       text not null,
  type        text not null default 'RAW_TEXT',
  status      text not null default 'PROCESSING', -- PROCESSING | READY | FAILED
  "createdAt" timestamptz not null default now()
);

create table if not exists "DocumentChunk" (
  id          uuid primary key,
  "documentId" uuid not null references "Document"(id) on delete cascade,
  content     text not null,
  embedding   vector(1536)
);

create index if not exists idx_document_widget on "Document" ("widgetId");
create index if not exists idx_chunk_document  on "DocumentChunk" ("documentId");
-- ANN index for fast vector search
create index if not exists idx_chunk_embedding
  on "DocumentChunk" using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 4. ChatSession — each visitor = one session
create table if not exists "ChatSession" (
  id          uuid primary key,
  "widgetId"  text not null references "Widget"(id) on delete cascade,
  "visitorId" text,
  "createdAt" timestamptz not null default now()
);
create index if not exists idx_session_widget on "ChatSession" ("widgetId");

-- 5. Message — dialog history
create table if not exists "Message" (
  id              uuid primary key default gen_random_uuid(),
  "sessionId"     uuid not null references "ChatSession"(id) on delete cascade,
  role            text not null check (role in ('USER','AI','SYSTEM')),
  content         text not null,
  sentiment       float,
  "needsAttention" boolean default false,
  "createdAt"     timestamptz not null default now()
);
create index if not exists idx_message_session on "Message" ("sessionId");

-- 6. Lead — captured contacts
create table if not exists "Lead" (
  id          uuid primary key,
  "widgetId"  text not null references "Widget"(id) on delete cascade,
  name        text,
  phone       text,
  email       text,
  context     text,
  "isSent"    boolean default false,
  "createdAt" timestamptz not null default now()
);
create index if not exists idx_lead_widget on "Lead" ("widgetId");

-- =============================================================================
-- 7. RPC: nearest neighbor search (cosine similarity) for RAG
-- =============================================================================
create or replace function match_document_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_widget_id text
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from "DocumentChunk" dc
  join "Document" d on dc."documentId" = d.id
  where d."widgetId" = p_widget_id
    and d.status = 'READY'
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- =============================================================================
-- 8. RLS — keep OFF for backend writes via anon key
-- В продакшне используйте SERVICE_ROLE_KEY и включите RLS с per-owner политиками.
-- =============================================================================
alter table "Widget"        disable row level security;
alter table "Document"      disable row level security;
alter table "DocumentChunk" disable row level security;
alter table "ChatSession"   disable row level security;
alter table "Message"       disable row level security;
alter table "Lead"          disable row level security;

-- =============================================================================
-- 9. Seed widgets — needed so the dashboard / demo / widget can work out-of-box
-- =============================================================================
insert into "Widget" (id, name, color, language, "isActive", greeting, "leadMode")
values
  ('wk_demo', 'Nexus Demo Widget', '#4f46e5', 'RU', true,
   'Здравствуйте! Я демо-ассистент Nexus AI. Чем могу помочь?', true),
  ('usr_osh_tour_2026', 'KG VIP Travel (sandbox)', '#6366f1', 'RU', true,
   'Здравствуйте! Я ассистент KG VIP Travel. Расскажу про туры по Кыргызстану.', true),
  ('wk_1a2b3c4d5e', 'Default Widget', '#4f46e5', 'RU', true,
   'Здравствуйте! Чем могу помочь?', false)
on conflict (id) do nothing;

-- =============================================================================
-- 10. updated_at trigger for Widget
-- =============================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists trg_widget_updated_at on "Widget";
create trigger trg_widget_updated_at
  before update on "Widget"
  for each row execute function set_updated_at();
