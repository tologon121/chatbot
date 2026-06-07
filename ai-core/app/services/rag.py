try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter

from google import genai
from google.genai import types
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
from typing import Iterable

_has_real_key = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your-gemini-key")
client = genai.Client(api_key=GEMINI_API_KEY) if _has_real_key else None

supabase = get_supabase()
logger = logging.getLogger(__name__)


def _mock_embed(text: str) -> list[float]:
    random.seed(hash(text))
    vec = [random.uniform(-0.1, 0.1) for _ in range(EMBEDDING_DIMENSIONS)]
    norm = sum(x * x for x in vec) ** 0.5 or 1.0
    return [x / norm for x in vec]


def _embed(text: str) -> list[float]:
    if not _has_real_key or client is None:
        return _mock_embed(text)
    try:
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
        )
        return result.embeddings[0].values
    except Exception as e:
        logger.warning(f"Gemini embedding failed: {e}. Falling back to mock embedding.")
        return _mock_embed(text)


def _embed_batch(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    if not _has_real_key or client is None:
        return [_mock_embed(t) for t in texts]
    out = []
    for text in texts:
        try:
            result = client.models.embed_content(
                model="text-embedding-004",
                contents=text,
            )
            out.append(result.embeddings[0].values)
        except Exception as e:
            logger.warning(f"Gemini embed failed: {e}. Mock fallback.")
            out.append(_mock_embed(text))
    return out


def process_and_store_document(document_id: str, widget_id: str, text: str) -> None:
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
        supabase.table("Document").update({"status": "READY"}).eq("id", document_id).execute()
        logger.info(f"Document {document_id} processed: {len(chunks)} chunks stored.")
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}")
        supabase.table("Document").update({"status": "FAILED"}).eq("id", document_id).execute()


def _retrieve_context(widget_id: str, user_message: str) -> str:
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
    persona_block = f"Persona / Brand voice instructions: {persona}\n" if persona else ""
    return f"""You are a polite, helpful AI assistant integrated into a business website.
Always reply in the specified language: {language}.
If the language is KG (Kyrgyz), use respectful and formal Kyrgyz phrasing.
If the answer is not in the context below, politely say you don't know and offer to connect the user to a human manager.
Keep answers concise (2-4 sentences) unless the user asks for detail.
{persona_block}
Context from the knowledge base:
\"\"\"
{context if context else "[no relevant context found]"}
\"\"\"
"""


_DEMO_FALLBACK_REPLY = {
    "RU": "Демо-режим: GEMINI_API_KEY не настроен, поэтому я отвечаю шаблоном.",
    "EN": "Demo mode: GEMINI_API_KEY is not configured.",
    "KG": "Демо-режим: GEMINI_API_KEY жок.",
}


def generate_rag_response(
    widget_id: str,
    user_message: str,
    language: str,
    persona: str | None = None,
) -> dict:
    context = _retrieve_context(widget_id, user_message)
    sentiment = analyze_sentiment(user_message)

    if not _has_real_key or client is None:
        fallback = _DEMO_FALLBACK_REPLY.get(language, _DEMO_FALLBACK_REPLY["EN"])
        return {"reply": fallback, "sentiment": sentiment, "needsAttention": sentiment < -0.4}

    try:
        system_prompt = _build_system_prompt(context, language, persona)
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=RAG_TEMPERATURE,
            ),
        )
        ai_message = response.text or ""
    except Exception as e:
        logger.warning(f"Gemini chat failed: {e}.")
        ai_message = _DEMO_FALLBACK_REPLY.get(language, _DEMO_FALLBACK_REPLY["EN"])

    return {"reply": ai_message, "sentiment": sentiment, "needsAttention": sentiment < -0.4}


def stream_rag_response(
    widget_id: str,
    user_message: str,
    language: str,
    persona: str | None = None,
) -> Iterable[str]:
    context = _retrieve_context(widget_id, user_message)

    if not _has_real_key or client is None:
        fallback = _DEMO_FALLBACK_REPLY.get(language, _DEMO_FALLBACK_REPLY["EN"])
        for word in fallback.split(" "):
            yield word + " "
        return

    try:
        system_prompt = _build_system_prompt(context, language, persona)
        stream = client.models.generate_content_stream(
            model="gemini-1.5-flash",
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=RAG_TEMPERATURE,
            ),
        )
        for chunk in stream:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        logger.warning(f"Gemini streaming failed: {e}.")
        fallback = _DEMO_FALLBACK_REPLY.get(language, _DEMO_FALLBACK_REPLY["EN"])
        for word in fallback.split(" "):
            yield word + " "


NEG_WORDS = ("плохо", "ужасно", "жалоба", "bad", "terrible", "жаман", "надоело", "обман", "scam", "awful")
POS_WORDS = ("спасибо", "отлично", "good", "great", "рахмат", "сонун", "thanks", "thank you", "супер", "perfect")


def analyze_sentiment(text: str) -> float:
    text_lower = text.lower()
    if any(w in text_lower for w in NEG_WORDS):
        return -0.8
    if any(w in text_lower for w in POS_WORDS):
        return 0.8
    return 0.0
