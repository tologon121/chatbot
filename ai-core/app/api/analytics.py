"""
Analytics API.

  GET /api/v1/analytics/overview/{widget_id}
      Aggregates Message/Lead/ChatSession into:
        - total conversations (sessions)
        - total leads
        - daily chart for last 7 days
        - sentiment buckets
        - language distribution (best-effort: from session count, MVP)
        - top intents (keyword-based, MVP)
        - recent leads (last 5)
"""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
import logging

from app.core.supabase_client import get_supabase

router = APIRouter()
supabase = get_supabase()
logger = logging.getLogger(__name__)


INTENT_KEYWORDS = {
    "Pricing Inquiry": [
        "цен", "стоимость", "тариф", "сколько", "price", "cost", "pricing",
        "плата", "оплат",
    ],
    "Product Support": [
        "поддержк", "проблем", "не работает", "ошибк", "помог", "issue",
        "support", "broken", "help",
    ],
    "Feature Request": [
        "функция", "хочу", "добавьте", "feature", "add", "request", "wish",
    ],
    "Sales Inquiry": [
        "купить", "заказать", "оформить", "buy", "order", "purchase",
    ],
    "Greeting": [
        "привет", "здравствуй", "hello", "hi", "салам",
    ],
}


def _parse_ts(value) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return None
    return None


def _classify_intent(text: str) -> str:
    lowered = (text or "").lower()
    for intent, kws in INTENT_KEYWORDS.items():
        if any(k in lowered for k in kws):
            return intent
    return "Other"


@router.get("/overview/{widget_id}")
async def overview(widget_id: str):
    try:
        sessions = (
            supabase.table("ChatSession")
            .select("*")
            .eq("widgetId", widget_id)
            .execute()
            .data
            or []
        )
        leads = (
            supabase.table("Lead")
            .select("*")
            .eq("widgetId", widget_id)
            .execute()
            .data
            or []
        )

        # Messages: best-effort — fetch all then filter by session_ids.
        # For a real DB this would be a SQL filter; the mock has no IN().
        session_ids = {s["id"] for s in sessions}
        all_msgs = (
            supabase.table("Message").select("*").execute().data or []
        )
        msgs = [m for m in all_msgs if m.get("sessionId") in session_ids]

        # --- daily chart: last 7 days, by session createdAt ---
        today = datetime.now(timezone.utc).date()
        days: list[dict] = []
        per_day = Counter()
        for s in sessions:
            ts = _parse_ts(s.get("createdAt"))
            if ts:
                per_day[ts.date()] += 1
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            days.append(
                {
                    "date": d.isoformat(),
                    "weekday": d.strftime("%a"),
                    "count": per_day.get(d, 0),
                }
            )

        # --- sentiment buckets from AI messages ---
        sentiments = [
            m.get("sentiment")
            for m in msgs
            if m.get("role") == "AI" and m.get("sentiment") is not None
        ]
        pos = sum(1 for s in sentiments if s and s > 0.2)
        neg = sum(1 for s in sentiments if s and s < -0.2)
        neu = max(0, len(sentiments) - pos - neg)
        total_sent = pos + neg + neu or 1
        sentiment = {
            "positive_pct": round(100 * pos / total_sent),
            "neutral_pct": round(100 * neu / total_sent),
            "negative_pct": round(100 * neg / total_sent),
            "sample_size": len(sentiments),
        }

        # --- top intents from USER messages ---
        intent_counts = Counter()
        for m in msgs:
            if m.get("role") == "USER":
                intent_counts[_classify_intent(m.get("content", ""))] += 1
        top_intents = [
            {"label": k, "count": v}
            for k, v in intent_counts.most_common(5)
            if k != "Other"
        ]
        # If nothing tagged, fall back to "Other" so UI shows something
        if not top_intents and intent_counts:
            top_intents = [
                {"label": k, "count": v} for k, v in intent_counts.most_common(5)
            ]

        # --- language distribution: heuristic on USER content ---
        lang_counts = Counter()
        for m in msgs:
            if m.get("role") != "USER":
                continue
            text = (m.get("content") or "")
            # heuristic: cyrillic vs latin vs kyrgyz-specific letters
            if any(ch in text for ch in "өүңӨҮҢ"):
                lang_counts["KG"] += 1
            elif any("а" <= ch.lower() <= "я" for ch in text):
                lang_counts["RU"] += 1
            elif any("a" <= ch.lower() <= "z" for ch in text):
                lang_counts["EN"] += 1
        total_lang = sum(lang_counts.values()) or 1
        languages = [
            {"code": code, "pct": round(100 * lang_counts.get(code, 0) / total_lang)}
            for code in ("RU", "EN", "KG")
        ]

        # --- recent leads ---
        recent = sorted(
            leads, key=lambda l: l.get("createdAt") or "", reverse=True
        )[:5]
        recent_leads = [
            {
                "id": l.get("id"),
                "name": l.get("name"),
                "email": l.get("email"),
                "phone": l.get("phone"),
                "createdAt": l.get("createdAt"),
            }
            for l in recent
        ]

        # --- resolution time: avg seconds between first USER msg and AI reply ---
        # group msgs by session, pair consecutive USER → AI
        by_sess: dict[str, list[dict]] = defaultdict(list)
        for m in msgs:
            by_sess[m.get("sessionId")].append(m)
        durations: list[float] = []
        for ms in by_sess.values():
            ms.sort(key=lambda x: x.get("createdAt") or "")
            for i in range(len(ms) - 1):
                if ms[i].get("role") == "USER" and ms[i + 1].get("role") == "AI":
                    t1 = _parse_ts(ms[i].get("createdAt"))
                    t2 = _parse_ts(ms[i + 1].get("createdAt"))
                    if t1 and t2:
                        durations.append((t2 - t1).total_seconds())
        avg_resolution = round(sum(durations) / len(durations)) if durations else 0

        return {
            "widget_id": widget_id,
            "totals": {
                "conversations": len(sessions),
                "leads": len(leads),
                "messages": len(msgs),
                "avg_resolution_sec": avg_resolution,
            },
            "chart_7d": days,
            "sentiment": sentiment,
            "top_intents": top_intents,
            "languages": languages,
            "recent_leads": recent_leads,
        }
    except Exception as e:
        logger.exception("analytics overview failed for %s", widget_id)
        raise HTTPException(status_code=500, detail=str(e))
