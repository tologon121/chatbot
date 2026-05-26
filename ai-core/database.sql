-- =============================================================================
-- Nexus AI — Supabase schema bootstrap
-- Запустите этот скрипт в SQL Editor Supabase один раз.
-- =============================================================================

-- 1. pgvector
create extension if not exists vector;

-- 2. Widget — публично-доступная конфигурация виджета клиента
--    isActive       — флаг включения
--    allowedDomains — список доменов (text[]) для проверки Origin
--    persona        — кастомный системный промт ("ты — бот компании X...")
--    greeting       — приветствие, которое отдает /chat/session
create table if not exists "Widget" (
  id              uuid primary key default gen_random_uuid(),
  "ownerId"       uuid,
  name            text not null,
  color           text default '#4f46e5',
  language        text default 'RU',
  "isActive"      boolean not null default true,
  "allowedDomains" text[] not null default '{}',
  persona         text,
  greeting        text,
  "leadMode"      boolean not null default false,
  "webhookUrl"    text,
  "createdAt"     timestamptz not null default now()
);

-- 3. Document & DocumentChunk (база знаний)
create table if not exists "Document" (
  id          uuid primary key,
  "widgetId"  uuid not null references "Widget"(id) on delete cascade,
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
-- ANN-индекс для быстрого векторного поиска
create index if not exists idx_chunk_embedding
  on "DocumentChunk" using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 4. ChatSession — каждый посетитель = одна сессия
create table if not exists "ChatSession" (
  id          uuid primary key,
  "widgetId"  uuid not null references "Widget"(id) on delete cascade,
  "visitorId" text,
  "createdAt" timestamptz not null default now()
);
create index if not exists idx_session_widget on "ChatSession" ("widgetId");

-- 5. Message — история диалога
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

-- 6. Lead — захваченные контакты
create table if not exists "Lead" (
  id          uuid primary key,
  "widgetId"  uuid not null references "Widget"(id) on delete cascade,
  name        text,
  phone       text,
  email       text,
  context     text,
  "isSent"    boolean default false,
  "createdAt" timestamptz not null default now()
);
create index if not exists idx_lead_widget on "Lead" ("widgetId");

-- =============================================================================
-- 7. RPC: поиск ближайших соседей (cosine similarity) для RAG
-- =============================================================================
create or replace function match_document_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_widget_id uuid
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
