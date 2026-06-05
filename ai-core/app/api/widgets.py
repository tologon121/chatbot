"""
Widgets API.

Endpoints:
  GET    /api/v1/widgets/                — list all widgets (admin / debug)
  GET    /api/v1/widgets/{widget_id}     — load single widget
  POST   /api/v1/widgets/                — create new widget
  PUT    /api/v1/widgets/{widget_id}     — update widget
  DELETE /api/v1/widgets/{widget_id}     — delete widget (cascade clears KB)
"""
from __future__ import annotations

import logging
import re
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.supabase_client import get_supabase

router = APIRouter()
supabase = get_supabase()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class WidgetCreate(BaseModel):
    id: Optional[str] = Field(default=None, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    color: Optional[str] = "#4f46e5"
    language: Optional[str] = "RU"
    position: Optional[str] = "bottom-right"
    is_active: bool = True
    allowed_domains: Optional[list[str]] = None
    persona: Optional[str] = None
    greeting: Optional[str] = None
    lead_mode: bool = False
    webhook_url: Optional[str] = None
    owner_id: Optional[str] = None


class WidgetUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=160)
    color: Optional[str] = None
    language: Optional[str] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None
    allowed_domains: Optional[list[str]] = None
    persona: Optional[str] = None
    greeting: Optional[str] = None
    lead_mode: Optional[bool] = None
    webhook_url: Optional[str] = None


_ID_RE = re.compile(r"^[a-zA-Z0-9_\-]{3,80}$")


def _generate_widget_id() -> str:
    """Generate a short, human-friendly widget id (wk_<10 hex>)."""
    return f"wk_{uuid.uuid4().hex[:10]}"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/")
async def list_widgets(owner_id: Optional[str] = None):
    """List all widgets, optionally filtered by owner."""
    try:
        q = supabase.table("Widget").select("*")
        if owner_id:
            q = q.eq("ownerId", owner_id)
        res = q.execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Error listing widgets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{widget_id}")
async def get_widget(widget_id: str):
    """Load a single widget."""
    try:
        res = (
            supabase.table("Widget")
            .select("*")
            .eq("id", widget_id)
            .limit(1)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Widget not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading widget {widget_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_widget(payload: WidgetCreate):
    """Create a new widget."""
    widget_id = payload.id or _generate_widget_id()
    if not _ID_RE.match(widget_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid widget id. Allowed: 3-80 chars, letters/digits/_/-",
        )

    row = {
        "id": widget_id,
        "name": payload.name,
        "color": payload.color or "#4f46e5",
        "language": payload.language or "RU",
        "position": payload.position or "bottom-right",
        "isActive": payload.is_active,
        "allowedDomains": payload.allowed_domains or [],
        "persona": payload.persona,
        "greeting": payload.greeting,
        "leadMode": payload.lead_mode,
        "webhookUrl": payload.webhook_url,
        "ownerId": payload.owner_id,
    }

    try:
        res = supabase.table("Widget").insert(row).execute()
        return {"status": "success", "widget": (res.data or [row])[0]}
    except Exception as e:
        # likely duplicate id
        logger.error(f"Error creating widget: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to create widget: {e}")


@router.put("/{widget_id}")
async def update_widget(widget_id: str, payload: WidgetUpdate):
    """Update widget fields. Partial — only supplied fields are changed."""
    updates: dict = {}
    if payload.name is not None:            updates["name"] = payload.name
    if payload.color is not None:           updates["color"] = payload.color
    if payload.language is not None:        updates["language"] = payload.language
    if payload.position is not None:        updates["position"] = payload.position
    if payload.is_active is not None:       updates["isActive"] = payload.is_active
    if payload.allowed_domains is not None: updates["allowedDomains"] = payload.allowed_domains
    if payload.persona is not None:         updates["persona"] = payload.persona
    if payload.greeting is not None:        updates["greeting"] = payload.greeting
    if payload.lead_mode is not None:       updates["leadMode"] = payload.lead_mode
    if payload.webhook_url is not None:     updates["webhookUrl"] = payload.webhook_url

    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")

    try:
        res = (
            supabase.table("Widget")
            .update(updates)
            .eq("id", widget_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Widget not found")
        return {"status": "success", "widget": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating widget {widget_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{widget_id}")
async def delete_widget(widget_id: str):
    """Delete a widget (cascade deletes its knowledge base, sessions, leads)."""
    try:
        supabase.table("Widget").delete().eq("id", widget_id).execute()
        return {"status": "success", "message": f"Widget {widget_id} deleted."}
    except Exception as e:
        logger.error(f"Error deleting widget {widget_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
