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

## Что добавлено в v1.2

- ✅ **Widget ID теперь text, не uuid** — гибкие идентификаторы (`wk_xxx`,
   `usr_xxx`, …) и совместимость со старыми вшитыми ID. Если у вас была
   старая схема — запустите `ai-core/migration.sql`.
- ✅ **Seed-данные** в `database.sql`: 3 готовых виджета (`wk_demo`,
   `usr_osh_tour_2026`, `wk_1a2b3c4d5e`) — база работает сразу после `\i database.sql`.
- ✅ **CRUD-API для виджетов**: `/api/v1/widgets/` (create/list/get/update/delete).
- ✅ **Dashboard: глобальный widget-picker** — все страницы (Knowledge Base,
   Widget Settings, Integration) работают с активным виджетом. На странице
   настроек кнопка «Сохранить» реально пишет в БД.
- ✅ **Дашборд: рабочий sign-out** и user pill с email/именем.
- ✅ **Improved mock Supabase**: in-memory store с insert/select/update/delete,
   фильтрами и mock RPC — позволяет полностью локально тестировать KB-флоу
   без живого Supabase.
- ✅ **/api/chat fallback**: если ai-core недоступен И OpenAI ключ не задан,
   возвращается дружелюбная демо-заглушка вместо ошибки 500.
- ✅ **/api/v1/chat/session auto-bootstrap**: `/api/chat` сам создает сессию
   при первом обращении (раньше нужно было дергать /chat/session вручную).

### Быстрый старт (после обновления)

1. Запустите `database.sql` в Supabase SQL Editor (если нужно мигрировать —
   `migration.sql`).
2. В `.env` (ai-core) укажите **JWT** Supabase ключ (anon или service_role).
   Префиксные ключи вида `sb_publishable_xxx` не подходят для Python SDK.
3. `uvicorn main:app --reload` — бэкенд на 8000.
4. В `dashboard/.env` задайте `NEXT_PUBLIC_API_URL=http://localhost:8000`.
5. `npm run dev` — дашборд на 3000. На странице Knowledge Base увидите
   список виджетов — выберите любой и грузите документы.
