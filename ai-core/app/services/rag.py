try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter  # type: ignore

import google.generativeai as genai
from app.core.config import (
    GEMINI_API_KEY,
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

# Gemini клиентти баштатуу
_has_real_key = GEMINI_API_KEY and GEMINI_API_KEY != "your-gemini-key"
if _has_real_key:
    genai.configure(api_key=GEMINI_API_KEY)

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
    """Gemini embedding үчүн text-embedding-004 моделин колдонот."""
    if not _has_real_key:
        return _mock_embed(text)
    try:
        result = genai.embed_content(
            model=OPENAI_EMBEDDING_MODEL,
            content=text,
        )
        return result["embedding"]
    except Exception as e:
        logger.warning(f"Gemini embedding failed: {e}. Falling back to mock embedding.")
        return _mock_embed(text)


def _embed_batch(texts: list[str], batch_size: int = 100) -> list[list[float]]:
    """Батч эмбеддинг — ар бир текст үчүн өзүнчө чалуу (Gemini batch API жок)."""
    if not texts:
        return []
    if not _has_real_key:
        return [_mock_embed(t) for t in texts]
    out: list[list[float]] = []
    for text in texts:
        try:
            result = genai.embed_content(
                model=OPENAI_EMBEDDING_MODEL,
                content=text,
            )
            out.append(result["embedding"])
        except Exception as e:
            logger.warning(f"Gemini embed failed: {e}. Mock fallback.")
            out.append(_mock_embed(text))
    return out


# ---------------------------------------------------------------------------
# Ingest pipeline
# ---------------------------------------------------------------------------
def process_and_store_document(document_id: str, widget_id: str, text: str) -> None:
    """
    Фондук тапшырма: текстти чанктарга бөлөт, Gemini аркылуу эмбеддинг жасайт,
    Supabase pgvector'го сактайт.
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
        logger.info(f"Document {document_id} processed: {len(chunks)} chunks stored.")

    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}")
        supabase.table("Document").update({"status": "FAILED"}).eq(
            "id", document_id
        ).execute()


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------
def _retrieve_context(widget_id: str, user_message: str) -> str:
    """Векторлук издөө — колдонуучунун суроосуна туура чанктарды табат."""
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
# Demo fallback
# ---------------------------------------------------------------------------
_DEMO_FALLBACK_REPLY = {
    "RU": (
        "Демо-режим: GEMINI_API_KEY не настроен, поэтому я отвечаю "
        "шаблоном. Контекст из базы знаний найден — задайте конкретный "
        "вопрос, и в реальном виджете я отвечу по нему."
    ),
    "EN": (
        "Demo mode: GEMINI_API_KEY isn't configured, so I'm replying with "
        "a stub. Context was retrieved from the knowledge base — a live "
        "deployment would answer for real."
    ),
    "KG": (
        "Демо-режим: GEMINI_API_KEY жок, ошондуктан шаблон менен жооп берем."
    ),
}


# ---------------------------------------------------------------------------
# Generation (non-streaming)
# ---------------------------------------------------------------------------
def generate_rag_response(
    widget_id: str,
    user_message: str,
    language: str,
    persona: str | None = None,
) -> dict:
    context = _retrieve_context(widget_id, user_message)
    sentiment = analyze_sentiment(user_message)

    if not _has_real_key:
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
        model = genai.GenerativeModel(
            model_name=OPENAI_CHAT_MODEL,
            system_instruction=system_prompt,
            generation_config={"temperature": RAG_TEMPERATURE},
        )
        response = model.generate_content(user_message)
        ai_message = response.text or ""
    except Exception as e:
        logger.warning(f"Gemini chat failed: {e}. Falling back to demo reply.")
        snippet = context[:400] if context else ""
        fallback = _DEMO_FALLBACK_REPLY.get(language, _DEMO_FALLBACK_REPLY["EN"])
        ai_message = f"{fallback}\n\n{snippet}" if snippet else fallback

    return {
        "reply": ai_message,
        "sentiment": sentiment,
        "needsAttention": sentiment < -0.4,
    }


# ---------------------------------------------------------------------------
# Generation (streaming) — SSE үчүн
# ---------------------------------------------------------------------------
def stream_rag_response(
    widget_id: str,
    user_message: str,
    language: str,
    persona: str | None = None,
) -> Iterable[str]:
    context = _retrieve_context(widget_id, user_message)

    if not _has_real_key:
        snippet = context[:400] if context else ""
        fallback = _DEMO_FALLBACK_REPLY.get(language, _DEMO_FALLBACK_REPLY["EN"])
        text = f"{fallback}\n\n{snippet}" if snippet else fallback
        for word in text.split(" "):
            yield word + " "
        return

    try:
        system_prompt = _build_system_prompt(context, language, persona)
        model = genai.GenerativeModel(
            model_name=OPENAI_CHAT_MODEL,
            system_instruction=system_prompt,
            generation_config={"temperature": RAG_TEMPERATURE},
        )
        stream = model.generate_content(user_message, stream=True)
        for chunk in stream:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        logger.warning(f"Gemini streaming failed: {e}. Falling back to demo reply.")
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
    text_lower = text.lower()
    if any(w in text_lower for w in NEG_WORDS):
        return -0.8
    if any(w in text_lower for w in POS_WORDS):
        return 0.8
    return 0.0
