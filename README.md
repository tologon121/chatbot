# Nexus AI — Embeddable RAG Chatbot Platform

Multi-tenant SaaS, который позволяет **любому владельцу сайта** добавить
интеллектуального AI-чатбота одним тегом `<script>`. Бот отвечает,
опираясь на загруженную клиентом базу знаний (RAG-поиск по pgvector),
поддерживает 3 языка (RU/EN/KG), захватывает лиды и отправляет их в CRM
через webhook.

## Архитектура

```
┌────────────────────┐      ┌──────────────────────┐      ┌────────────────┐
│  Сайт клиента      │      │  Dashboard (Next.js) │      │  AI Core       │
│  <script src=…/>   │      │  • Управление        │      │  (FastAPI)     │
│  ──────────────►   │      │  • Knowledge Base    │      │  • RAG         │
│  Виджет (Shadow    │◄────►│  • Аналитика         │◄────►│  • Streaming   │
│  DOM, изолирован)  │ SSE  │  • Биллинг           │ REST │  • Sessions    │
└────────────────────┘      └──────────────────────┘      └────────┬───────┘
                                                                   │
                                                          ┌────────▼────────┐
                                                          │  Supabase       │
                                                          │  • Postgres     │
                                                          │  • pgvector     │
                                                          │  • Auth         │
                                                          └─────────────────┘
```

| Папка       | Что это                                                                   |
|-------------|---------------------------------------------------------------------------|
| `ai-core/`  | FastAPI бэкенд — RAG, embeddings, SSE-стриминг, lead-webhooks             |
| `dashboard/`| Next.js админка + landing — пользовательский интерфейс                    |
| `widget/`   | Vite-сборка виджета в один JS-файл (IIFE) для встраивания на любой сайт   |

## Запуск локально

### 1. AI Core (бэкенд)

```bash
cd ai-core
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # заполните SUPABASE_*, OPENAI_API_KEY
# Один раз: выполните database.sql в Supabase SQL Editor
uvicorn main:app --reload --port 8000
```

API доступно: `http://localhost:8000/docs`

### 2. Dashboard

```bash
cd dashboard
npm install
echo "AI_CORE_URL=http://localhost:8000" >> .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local   # для fallback в /api/chat
npm run dev
```

Открыть: `http://localhost:3000`

### 3. Widget

```bash
cd widget
npm install
npm run build       # → dist/widget.iife.js
```

Готовый файл `dist/widget.iife.js` загружается на CDN (Cloudflare R2,
S3, Vercel static, etc.) и используется в скрипт-теге.

## Как клиент встраивает виджет

```html
<script
  src="https://cdn.nexusai.example.com/widget.iife.js"
  data-widget-id="wk_xxx"
  data-api-url="https://api.nexusai.example.com"
  data-color="#4f46e5"
  data-lang="RU"
  data-position="bottom-right"
  data-lead-mode="true"
  data-greeting="Здравствуйте! Чем помочь?"
  defer
></script>
```

Или программно:

```html
<script src="https://cdn.nexusai.example.com/widget.iife.js" defer></script>
<script>
  window.addEventListener("load", () => {
    window.NexusAI.init({
      widgetId: "wk_xxx",
      apiUrl: "https://api.nexusai.example.com",
      color: "#4f46e5",
    });
  });
</script>
```

### JavaScript API виджета

| Метод                          | Описание                                      |
|--------------------------------|-----------------------------------------------|
| `window.NexusAI.init(cfg)`     | Программная инициализация                     |
| `window.NexusAI.open()`        | Открыть окно чата                             |
| `window.NexusAI.close()`       | Свернуть                                      |
| `window.NexusAI.toggle()`      | Переключить                                   |
| `window.NexusAI.send(text)`    | Отправить сообщение от имени пользователя     |
| `window.NexusAI.destroy()`     | Полностью убрать виджет со страницы           |

## REST API (ai-core)

| Метод | Путь                          | Описание                                       |
|-------|-------------------------------|------------------------------------------------|
| GET   | `/health`                     | Проверка живости                               |
| POST  | `/api/v1/chat/session`        | Создать сессию для виджета                     |
| POST  | `/api/v1/chat/send`           | Один JSON-ответ                                |
| POST  | `/api/v1/chat/stream`         | SSE-стрим токенов                              |
| POST  | `/api/v1/ingest/upload-text`  | Добавить документ в базу знаний (фоном)        |
| POST  | `/api/v1/leads/capture`       | Захват лида (имя/email/телефон)                |

## Безопасность

- **Origin whitelist**: `Widget.allowedDomains[]` ограничивает домены, с
  которых разрешены запросы (поддержка `*.example.com`).
- **Rate limit**: 30 req/min на сессию (настраивается `RATE_LIMIT_PER_MINUTE`).
- **Service Role Key** Supabase используется на бэкенде, чтобы обходить
  RLS — никогда не показывайте этот ключ во фронтенде.
- **Shadow DOM** виджета изолирует стили клиентского сайта от стилей бота.

## Что улучшено в этой версии (v1.1)

- ✅ Современные модели: `gpt-4o-mini` + `text-embedding-3-small`
- ✅ SSE-стриминг ответов (печать токен-за-токеном)
- ✅ Управление сессиями + per-session rate limit
- ✅ Per-widget Origin whitelist
- ✅ Полноценный lead-capture flow в виджете
- ✅ Глобальный JS API (`window.NexusAI.*`)
- ✅ Конфигурация виджета через 8 data-атрибутов
- ✅ Страница `/dashboard/integration` с готовыми сниппетами для
   HTML, React, Next.js, Vue 3 и WordPress
- ✅ ANN-индекс pgvector (ivfflat) для быстрого поиска
- ✅ Persona / brand voice в системном промте

## Что добавлено в v1.3 (single-deploy mode)

**Ai-core больше не нужен для запуска.** Вся серверная логика (widgets, chat
с RAG, ingest, leads, analytics) портирована в Next.js Route Handlers под
`/api/v1/*` — деплоится одним проектом на Vercel.

- ✅ **13 Route Handlers** в `dashboard/src/app/api/v1/*` — полная замена
   FastAPI.
- ✅ **Single deploy**: один `git push` → Vercel поднимает фронт+бэк.
   Render/Fly/ngrok больше не нужны.
- ✅ **In-memory mock store** с seed-данными — работает без Supabase
   (для демо). Чтобы данные сохранялись — задайте `SUPABASE_SERVICE_ROLE_KEY`
   (JWT формат `eyJ...`) и накатите `ai-core/database.sql` в Supabase.
- ✅ **Without OpenAI key** — RAG ищет реальные чанки, ответ — friendly
   шаблон с извлечённым контекстом. С ключом — полноценный GPT-4o-mini.
- ✅ **Widget ID теперь text** — гибкие ID (`wk_xxx`, `usr_xxx`, …).
- ✅ **Auth middleware** защищает `/dashboard/*`, реальная аналитика
   (`/api/v1/analytics/overview`), страницы лидов и диалогов.

### Быстрый старт

```bash
cd dashboard
npm install
npm run dev          # http://localhost:3000
```

Всё работает без дополнительных сервисов. Демо отвечает по предзаряженной
базе знаний Nexus AI.

### Прод-деплой

1. `git push` → Vercel auto-deploy.
2. В Vercel → Settings → Environment Variables задайте (опционально):
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — чтобы данные жили
     между cold-start'ами
   - `OPENAI_API_KEY` — для настоящих ответов вместо demo-шаблона
   - `NEXTAUTH_URL` = ваш Vercel домен, `NEXTAUTH_SECRET` = любая
     длинная строка
3. (Опц.) Если задаёте Supabase — выполните `ai-core/database.sql` в SQL Editor.

### Self-hosted режим с FastAPI

`ai-core/` остаётся в репо для тех, кому нужен Python-бэкенд (например,
для тяжёлого PDF-парсинга через `pypdf`). В Vercel задайте
`NEXT_PUBLIC_API_URL=https://your-ai-core.example.com` — дашборд будет
обращаться к нему вместо встроенных Next.js routes.
