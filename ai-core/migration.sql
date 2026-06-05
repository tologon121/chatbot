-- =============================================================================
-- Migration: Old uuid-based Widget schema → new text-based Widget schema (v1.2)
-- Запустите этот файл в Supabase SQL Editor, ЕСЛИ у вас уже есть старая схема
-- с uuid Widget.id. Иначе используйте database.sql.
-- БУДЕТ удалена существующая база знаний (Document/Chunks/Sessions),
-- так как FK типы меняются. Сделайте бэкап перед запуском!
-- =============================================================================

-- 1. drop all dependent tables
drop table if exists "Message"       cascade;
drop table if exists "ChatSession"   cascade;
drop table if exists "DocumentChunk" cascade;
drop table if exists "Document"      cascade;
drop table if exists "Lead"          cascade;
drop table if exists "Widget"        cascade;

drop function if exists match_document_chunks(vector, float, int, uuid);
drop function if exists match_document_chunks(vector, float, int, text);
drop function if exists set_updated_at();

-- 2. Recreate via database.sql logic
\i database.sql
