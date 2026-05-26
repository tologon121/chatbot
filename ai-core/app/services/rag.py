try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:  # старая версия пакета — фолбэк
    from langchain.text_splitter import RecursiveCharacterTextSplitter  # type: ignore
from openai import OpenAI
from app.core.config import (
    OPENAI_API_KEY,
    OPENAI_CHAT_MODEL,
    OPENAI_EMBEDDING_MODEL,
    RAG_MATCH_THRESHOLD,
    RAG_MATCH_COUNT,
    RAG_TEMPERATURE,
)
from app.core.supabase_client import get_supabase
import uuid
import logging
from typing import Generator, Iterable

client = OpenAI(api_key=OPENAI_API_KEY)
supabase = get_supabase()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------
def _embed(text: str) -> list[float]:
    """Создает эмбеддинг для одной строки с актуальной моделью."""
    response = client.embeddings.create(
        input=text,
        model=OPENAI_EMBEDDING_MODEL,
    )
    return response.data[0].embedding


# ---------------------------------------------------------------------------
# Ingest pipeline
# ---------------------------------------------------------------------------
def process_and_store_document(document_id: str, widget_id: str, text: str) -> None:
    """
    Фоновая задача: разбивает текст на чанки, генерирует эмбеддинги через OpenAI
    и сохраняет их в векторную базу Supabase (pgvector).
    """
    try:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
            length_function=len,
        )
        chunks = text_splitter.split_text(text)
        if not chunks:
            raise ValueError("Empty document, nothing to ingest.")

        # Батч-вставка: безопаснее по сети, чем по одной строке
        rows = []
        for chunk in chunks:
            rows.append(
                {
                    "id": str(uuid.uuid4()),
                    "documentId": document_id,
                    "content": chunk,
                    "embedding": _embed(chunk),
                }
            )

        # Supabase Python SDK поддерживает массовую вставку
        supabase.table("DocumentChunk").insert(rows).execute()

        supabase.table("Document").update({"status": "READY"}).eq(
            "id", document_id
        ).execute()
        logger.info(
            f"Document {document_id} processed: {len(chunks)} chunks stored."
        )

    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}")
        supabase.table("Document").update({"status": "FAILED"}).eq(
            "id", document_id
        ).execute()


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------
def _retrieve_context(widget_id: str, user_message: str) -> str:
    """Векторный поиск релевантных чанков под запрос пользователя."""
    query_embedding = _embed(user_message)

    search_res = supabase.rpc(
        "match_document_chunks",
        {
            "query_embedding": query_embedding,
            "match_threshold": RAG_MATCH_THRESHOLD,
            "match_count": RAG_MATCH_COUNT,
            "p_widget_id": widget_id,
        },
    ).execute()

    if not search_res.data:
        return ""
    return "\n\n".join(item["content"] for item in search_res.data)


def _build_system_prompt(context: str, language: str, persona: str | None = None) -> str:
    persona_block = (
        f"Persona / Brand voice instructions: {persona}\n" if persona else ""
    )
    return f"""You are a polite, helpful AI assistant integrated into a business website.
Always reply in the specified language: {language}.
If the language is KG (Kyrgyz), use respectful and formal Kyrgyz phrasing (e.g., 'Сиз', 'Урматтуу').
If the answer is not in the context below, politely say you don't know and offer to connect the user to a human manager.
Keep answers concise (2-4 sentences) unless the user asks for detail.
{persona_block}
Context from the knowledge base:
\"\"\"
{context if context else "[no relevant context found]"}
\"\"\"
"""


# ---------------------------------------------------------------------------
# Generation (non-streaming) — обратная совместимость с /send
# ---------------------------------------------------------------------------
def generate_rag_response(
    widget_id: str,
    user_message: str,
    language: str,
    persona: str | None = None,
) -> dict:
    """Генерирует один ответ RAG (non-streaming)."""
    context = _retrieve_context(widget_id, user_message)
    sentiment = analyze_sentiment(user_message)
    system_prompt = _build_system_prompt(context, language, persona)

    chat_completion = client.chat.completions.create(
        model=OPENAI_CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=RAG_TEMPERATURE,
    )

    ai_message = chat_completion.choices[0].message.content or ""

    return {
        "reply": ai_message,
        "sentiment": sentiment,
        "needsAttention": sentiment < -0.4,
    }


# ---------------------------------------------------------------------------
# Generation (streaming) — для SSE-эндпоинта
# ---------------------------------------------------------------------------
def stream_rag_response(
    widget_id: str,
    user_message: str,
    language: str,
    persona: str | None = None,
) -> Iterable[str]:
    """
    Генератор токенов для Server-Sent Events.
    Yield-ит чистый текст; форматирование SSE делает эндпоинт.
    """
    context = _retrieve_context(widget_id, user_message)
    system_prompt = _build_system_prompt(context, language, persona)

    stream = client.chat.completions.create(
        model=OPENAI_CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=RAG_TEMPERATURE,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            yield delta


# ---------------------------------------------------------------------------
# Sentiment (lightweight)
# ---------------------------------------------------------------------------
NEG_WORDS = (
    "плохо", "ужасно", "жалоба", "bad", "terrible", "жаман",
    "надоело", "отвратительно", "обман", "scam", "kötü", "awful",
)
POS_WORDS = (
    "спасибо", "отлично", "good", "great", "рахмат", "сонун",
    "thanks", "thank you", "супер", "perfect",
)


def analyze_sentiment(text: str) -> float:
    """Облегченный rule-based сентимент (-1..1). Для прода — VADER/LLM."""
    text_lower = text.lower()
    if any(w in text_lower for w in NEG_WORDS):
        return -0.8
    if any(w in text_lower for w in POS_WORDS):
        return 0.8
    return 0.0
