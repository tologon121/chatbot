"""
Chat API.

Endpoints:
  POST /api/v1/chat/session   — создает новую сессию для виджета
  POST /api/v1/chat/send      — обычный (non-streaming) ответ
  POST /api/v1/chat/stream    — Server-Sent Events со стримом токенов

Дополнительно:
  - Валидация виджета (существует ли он и активен)
  - Опциональная валидация Origin против Widget.allowedDomains
  - Сохранение сообщений в БД
  - Триггер фоновой задачи при негативном sentiment
"""
from __future__ import annotations

import json
import time
import uuid
from collections import defaultdict, deque
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.config import RATE_LIMIT_PER_MINUTE
from app.core.supabase_client import get_supabase
from app.services.integrations import handle_negative_sentiment
from app.services.rag import (
    analyze_sentiment,
    generate_rag_response,
    stream_rag_response,
)

router = APIRouter()
supabase = get_supabase()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class SessionRequest(BaseModel):
    widget_id: str
    visitor_id: Optional[str] = None  # анонимный id для повторного захода


class SessionResponse(BaseModel):
    session_id: str
    widget_id: str
    greeting: Optional[str] = None


class ChatRequest(BaseModel):
    widget_id: str
    session_id: str
    message: str = Field(min_length=1, max_length=4000)
    language: str = "RU"


class ChatResponse(BaseModel):
    reply: str
    sentiment: float


# ---------------------------------------------------------------------------
# Lightweight in-memory rate limiter (per session)
# В проде — заменить на Redis.
# ---------------------------------------------------------------------------
_buckets: dict[str, deque[float]] = defaultdict(deque)


def _rate_limit(key: str) -> None:
    now = time.time()
    window = _buckets[key]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= RATE_LIMIT_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    window.append(now)


# ---------------------------------------------------------------------------
# Widget validation
# ---------------------------------------------------------------------------
def _load_widget(widget_id: str) -> dict:
    """Загружает виджет и проверяет, что он активен."""
    res = (
        supabase.table("Widget")
        .select("id, name, isActive, allowedDomains, persona, greeting")
        .eq("id", widget_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Widget not found")

    widget = res.data[0]
    if widget.get("isActive") is False:
        raise HTTPException(status_code=403, detail="Widget is disabled")
    return widget


def _check_origin(widget: dict, origin: Optional[str]) -> None:
    """
    Если у виджета задан allowedDomains (массив строк),
    то Origin запроса обязан совпадать с одним из них.
    Иначе разрешено везде (для свободного встраивания).
    """
    allowed = widget.get("allowedDomains") or []
    if not allowed:
        return
    if not origin:
        raise HTTPException(status_code=403, detail="Origin header missing")
    # допускаем как точные совпадения, так и хост-суффиксы (*.example.com)
    for domain in allowed:
        domain = domain.strip().lower()
        if not domain:
            continue
        if domain.startswith("*."):
            suffix = domain[1:]
            if origin.lower().endswith(suffix):
                return
        elif origin.lower().rstrip("/") == domain.rstrip("/"):
            return
    raise HTTPException(status_code=403, detail="Origin not allowed for this widget")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/session", response_model=SessionResponse)
async def create_session(req: SessionRequest, request: Request):
    """Создает новую сессию чата для виджета."""
    widget = _load_widget(req.widget_id)
    _check_origin(widget, request.headers.get("origin"))

    session_id = str(uuid.uuid4())
    supabase.table("ChatSession").insert(
        {
            "id": session_id,
            "widgetId": req.widget_id,
            "visitorId": req.visitor_id,
        }
    ).execute()

    return SessionResponse(
        session_id=session_id,
        widget_id=req.widget_id,
        greeting=widget.get("greeting"),
    )


@router.post("/send", response_model=ChatResponse)
async def send_message(req: ChatRequest, background_tasks: BackgroundTasks, request: Request):
    """Обычный JSON-ответ (не-стриминговый)."""
    widget = _load_widget(req.widget_id)
    _check_origin(widget, request.headers.get("origin"))
    _rate_limit(req.session_id)

    # 1) сохраняем сообщение пользователя
    supabase.table("Message").insert(
        {
            "sessionId": req.session_id,
            "role": "USER",
            "content": req.message,
        }
    ).execute()

    # 2) генерируем ответ
    try:
        ai_response = generate_rag_response(
            widget_id=req.widget_id,
            user_message=req.message,
            language=req.language,
            persona=widget.get("persona"),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e}")

    # 3) сохраняем ответ
    supabase.table("Message").insert(
        {
            "sessionId": req.session_id,
            "role": "AI",
            "content": ai_response["reply"],
            "sentiment": ai_response["sentiment"],
            "needsAttention": ai_response["needsAttention"],
        }
    ).execute()

    # 4) триггер на негатив
    if ai_response["needsAttention"]:
        background_tasks.add_task(
            handle_negative_sentiment,
            req.widget_id,
            req.session_id,
            req.message,
        )

    return ChatResponse(reply=ai_response["reply"], sentiment=ai_response["sentiment"])


@router.post("/stream")
async def stream_message(req: ChatRequest, request: Request):
    """
    Server-Sent Events: токены приходят по одному, UI печатает плавно.
    Формат событий:
      event: token   data: <chunk>
      event: done    data: {"sentiment": 0.0}
    """
    widget = _load_widget(req.widget_id)
    _check_origin(widget, request.headers.get("origin"))
    _rate_limit(req.session_id)

    # сохраняем сообщение пользователя сразу
    supabase.table("Message").insert(
        {"sessionId": req.session_id, "role": "USER", "content": req.message}
    ).execute()

    def sse_generator():
        buffer: list[str] = []
        try:
            for token in stream_rag_response(
                widget_id=req.widget_id,
                user_message=req.message,
                language=req.language,
                persona=widget.get("persona"),
            ):
                buffer.append(token)
                yield f"event: token\ndata: {json.dumps(token)}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps(str(e))}\n\n"
            return

        full_reply = "".join(buffer)
        sentiment = analyze_sentiment(req.message)

        # сохраняем ответ AI
        try:
            supabase.table("Message").insert(
                {
                    "sessionId": req.session_id,
                    "role": "AI",
                    "content": full_reply,
                    "sentiment": sentiment,
                    "needsAttention": sentiment < -0.4,
                }
            ).execute()
        except Exception:
            pass

        yield (
            "event: done\n"
            f"data: {json.dumps({'sentiment': sentiment})}\n\n"
        )

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # отключает буферизацию nginx
        },
    )


# ---------------------------------------------------------------------------
# Conversation history endpoints (for dashboard)
# ---------------------------------------------------------------------------
@router.get("/sessions/{widget_id}")
async def list_sessions(widget_id: str):
    """List chat sessions for a widget, newest first, with message_count + last_message."""
    try:
        sessions = (
            supabase.table("ChatSession")
            .select("*")
            .eq("widgetId", widget_id)
            .execute()
            .data
            or []
        )
        # Fetch all messages once and group by session in Python.
        # (Real Postgres would use SELECT ... IN.)
        all_msgs = supabase.table("Message").select("*").execute().data or []
        by_session: dict[str, list[dict]] = {}
        for m in all_msgs:
            sid = m.get("sessionId")
            if sid:
                by_session.setdefault(sid, []).append(m)
        for s in sessions:
            msgs = by_session.get(s["id"], [])
            msgs.sort(key=lambda x: x.get("createdAt") or "")
            s["messageCount"] = len(msgs)
            s["lastMessage"] = msgs[-1]["content"] if msgs else None
        sessions.sort(key=lambda x: x.get("createdAt") or "", reverse=True)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages/{session_id}")
async def list_messages(session_id: str):
    """List messages for a chat session, oldest first."""
    try:
        msgs = (
            supabase.table("Message")
            .select("*")
            .eq("sessionId", session_id)
            .execute()
            .data
            or []
        )
        msgs.sort(key=lambda x: x.get("createdAt") or "")
        return msgs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
