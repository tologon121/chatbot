import os
from dotenv import load_dotenv

load_dotenv()

# ---------- Supabase ----------
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-supabase-url.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
    "SUPABASE_KEY", "your-supabase-anon-key"
)

# ---------- Gemini ----------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-key")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gemini-1.5-flash")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "models/text-embedding-004")
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))

# ---------- RAG ----------
RAG_MATCH_THRESHOLD = float(os.getenv("RAG_MATCH_THRESHOLD", "0.75"))
RAG_MATCH_COUNT = int(os.getenv("RAG_MATCH_COUNT", "4"))
RAG_TEMPERATURE = float(os.getenv("RAG_TEMPERATURE", "0.3"))

# ---------- CORS / Security ----------
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if o.strip()
]

RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))
APP_VERSION = os.getenv("APP_VERSION", "1.1.0")
