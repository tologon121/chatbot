import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# ---------- Supabase ----------
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-supabase-url.supabase.co")
# В проде используйте SERVICE_ROLE_KEY на бэкенде, чтобы обходить RLS
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
    "SUPABASE_KEY", "your-supabase-anon-key"
)

# ---------- OpenAI ----------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-openai-key")
# Современные дешевые/быстрые модели по умолчанию (можно переопределить через .env)
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
# Размерность text-embedding-3-small = 1536 (как у ada-002), совместимо с pgvector
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "1536"))

# ---------- RAG ----------
RAG_MATCH_THRESHOLD = float(os.getenv("RAG_MATCH_THRESHOLD", "0.75"))
RAG_MATCH_COUNT = int(os.getenv("RAG_MATCH_COUNT", "4"))
RAG_TEMPERATURE = float(os.getenv("RAG_TEMPERATURE", "0.3"))

# ---------- CORS / Security ----------
# Список доменов, которые могут использовать любой виджет (фолбэк)
# Реальная проверка домена выполняется per-widget в БД (Widget.allowedDomains)
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if o.strip()
]

# Rate limit (запросов в минуту на session_id)
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))

# Версия API (для health-check и логов)
APP_VERSION = os.getenv("APP_VERSION", "1.1.0")
