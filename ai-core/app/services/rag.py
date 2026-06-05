try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:  # старая версия пакета — фолбэк
    from langchain.text_splitter import RecursiveCharacterTextSplitter  # type: ignore
from openai import OpenAI
from app.core.config import (
    OPENAI_API_KEY,
    OPENAI_CHAT_MODEL,
    OPENAI_EMBEDDING_MODEL,
    EMBEDDING_DIMENSIONS,
    RAG_MATCH_THRESHOLD,
    RAG_MATCH_COUNT,
    RAG_TEMPERATURE,
)
from app.core.supabase_client import get_supabase
import uuid
import logging
import random
from typing import Generator, Iterable

client = OpenAI(api_key=OPENAI_API_KEY)
supabase = get_supabase()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------
def _mock_embed(text: str) -> list[float]:
    random.seed(hash(text))
    vec = [random.uniform(-0.1, 0.1) for _ in range(EMBEDDING_DIMENSIONS)]
    norm = sum(x * x for x in vec) ** 0.5 or 1.0
    return [x / norm for x in vec]


def _embed(text: str) -> list[float]:
    """Создает эмбеддинг для одной строки с актуальной моделью (с фолбэком)."""
    if not OPENAI_API_KEY or OPENAI_API_KEY == "your-openai-key":
        return _mock_embed(text)
    try:
        response = client.embeddings.create(
            input=text,
            model=OPENAI_EMBEDDING_MODEL,
        )
        return response.data[0].embedding
    except Exception as e:
        logger.warning(f"OpenAI embedding generation failed: {e}. Falling back to mock embedding.")
        return _mock_embed(text)


def _embed_batch(texts: list[str], batch_size: int = 100) -> list[list[float]]:
    """Батч-эмбеддинги: один HTTP-вызов на 100 строк вместо 100 вызовов.
    Драматически быстрее и дешевле при загрузке большого документа.
    """
    if not texts:
        return []
    if not OPENAI_API_KEY or OPENAI_API_KEY == "your-openai-key":
        return [_mock_embed(t) for t in texts]
    out: list[list[float]] = []
    for i in range(0, len(texts), batch_size):
        chunk = texts[i : i + batch_size]
        try:
            res = client.embeddings.create(
                input=chunk,
                model=OPENAI_EMBEDDING_MODEL,
            )
            out.extend(item.embedding for item in res.data)
        except Exception as e:
            logger.warning(
                f"Batch embed failed (chunk {i}-{i+len(chunk)}): {e}. Mock fallback."
            )
            out.extend(_mock_embed(t) for t in chunk)
    return out


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

        # Batch all embeddings in one OpenAI call — ~50x faster.
        embeddings = _embed_batch(chunks)

        rows = [
            {
                "id": str(uuid.uuid4()),
                "documentId": document_id,
                "content": chunk,
                "embedding": emb,
            }
            for chunk, emb in zip(chunks, embeddings)
        ]
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
_DEMO_FALLBACK_REPLY = {
    "RU": (
        "Демо-режим: OPENAI_API_KEY не настроен, поэтому я отвечаю "
        "шаблоном. Контекст из базы знаний найден — задайте конкретный "
        "вопрос, и в реальном виджете я отвечу по нему."
    ),
    "EN": (
        "Demo mode: OPENAI_API_KEY isn't configured, so I'm replying with "
        "a stub. Context was retrieved from the knowledge base — a live "
        "deployment would answer for real."
    ),
    "KG": (
        "Демо-режим: OPENAI_API_KEY жок, ошондуктан шаблон менен жооп берем."
    ),
}


def generate_rag_response(
    widget_id: str,
    user_message: str,
    language: str,
    persona: str | None = None,
) -> dict:
    """Генерирует один ответ RAG (non-streaming).

    Если OPENAI_API_KEY не задан или OpenAI API падает — возвращает
    дружелюбную demo-заглушку с контекстом из RAG-поиска, вместо ошибки 502.
    """
    context = _retrieve_context(widget_id, user_message)
    sentiment = analyze_sentiment(user_message)

    has_real_key = OPENAI_API_KEY and OPENAI_API_KEY != "your-openai-key"

    if not has_real_key:
        # Echo the retrieved context so /demo still feels alive.
        snippet = context[:400] if context else ""
        fallback = _DEMO_FALLBACK_REPLY.get(language, _DEMO_FALLBACK_REPLY["EN"])
        reply = f"{fallback}\n\n{snippet}" if snippet else fallback
        return {
            "reply": reply,
            "sentiment": sentiment,
            "needsAttention": sentiment < -0.4,
        }

    try:
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
    except Exception as e:
        logger.warning(f"OpenAI chat completion failed: {e}. Falling back to demo reply.")
        snippet = context[:400] if context else ""
        fallback = _DEMO_FALLBACK_REPLY.get(language, _DEMO_FALLBACK_REPLY["EN"])
        ai_message = f"{fallback}\n\n{snippet}" if snippet else fallback

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
    Если OPENAI_API_KEY отсутствует — стримит demo-заглушку посимвольно.
    """
    context = _retrieve_context(widget_id, user_message)
    has_real_key = OPENAI_API_KEY and OPENAI_API_KEY != "your-openai-key"

    if not has_real_key:
        snippet = context[:400] if context else ""
        fallback = _DEMO_FALLBACK_REPLY.get(language, _DEMO_FALLBACK_REPLY["EN"])
        text = f"{fallback}\n\n{snippet}" if snippet else fallback
        # Stream word-by-word to simulate live typing
        for word in text.split(" "):
            yield word + " "
        return

    try:
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
    except Exception as e:
        logger.warning(f"OpenAI streaming failed: {e}. Falling back to demo reply.")
        fallback = _DEMO_FALLBACK_REPLY.get(language, _DEMO_FALLBACK_REPLY["EN"])
        for word in fallback.split(" "):
            yield word + " "


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
