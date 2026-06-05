"""
Supabase client with a resilient mock fallback.

If SUPABASE_URL / SUPABASE_KEY are missing or look like placeholders, we
return an in-memory mock client that *acts* like Supabase well enough for
local development without a database. All writes / reads survive the
process lifetime, so the dashboard can show the documents it just uploaded.
"""
from __future__ import annotations

import uuid
from threading import RLock
from typing import Any, Optional

from supabase import create_client, Client

from app.core.config import SUPABASE_URL, SUPABASE_KEY


def safe_print(msg: str) -> None:
    try:
        print(msg)
    except UnicodeEncodeError:
        try:
            print(msg.encode("ascii", errors="backslashreplace").decode("ascii"))
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Mock implementation
# ---------------------------------------------------------------------------
class _MockResponse:
    def __init__(self, data: list[dict]):
        self.data = data


class _MockTable:
    """In-memory table that supports insert/select/update/delete + eq() filter."""

    def __init__(self, store: dict[str, list[dict]], name: str):
        self._store = store
        self._name = name
        self._store.setdefault(name, [])
        self._op: Optional[str] = None
        self._payload: Any = None
        self._filters: list[tuple[str, Any]] = []
        self._cols: list[str] = []

    # ---- builder steps ----
    def insert(self, data):
        self._op = "insert"
        self._payload = data
        return self

    def select(self, *args, **_kw):
        self._op = "select"
        self._cols = list(args)
        return self

    def update(self, data: dict):
        self._op = "update"
        self._payload = data
        return self

    def delete(self):
        self._op = "delete"
        return self

    def eq(self, col: str, val: Any):
        self._filters.append((col, val))
        return self

    def limit(self, _n: int):
        return self

    def order(self, *_args, **_kw):
        return self

    def _match(self, row: dict) -> bool:
        return all(row.get(c) == v for c, v in self._filters)

    # ---- terminal ----
    def execute(self) -> _MockResponse:
        rows = self._store[self._name]

        if self._op == "insert":
            payload = self._payload
            items = payload if isinstance(payload, list) else [payload]
            # populate defaults / autogenerate id
            for item in items:
                if "id" not in item or item["id"] is None:
                    item["id"] = str(uuid.uuid4())
                rows.append(dict(item))
            safe_print(f"[MOCK Supabase] inserted {len(items)} into {self._name}")
            return _MockResponse(items)

        if self._op == "select":
            matched = [r for r in rows if self._match(r)]
            return _MockResponse([dict(r) for r in matched])

        if self._op == "update":
            updated = []
            for r in rows:
                if self._match(r):
                    r.update(self._payload)
                    updated.append(dict(r))
            return _MockResponse(updated)

        if self._op == "delete":
            keep = [r for r in rows if not self._match(r)]
            deleted = [r for r in rows if self._match(r)]
            self._store[self._name] = keep
            return _MockResponse(deleted)

        return _MockResponse([])


class MockSupabaseClient:
    def __init__(self):
        self._store: dict[str, list[dict]] = {}
        self._lock = RLock()
        # Seed default widgets so dashboard/demo work out of the box
        self._store["Widget"] = [
            {
                "id": "wk_demo",
                "ownerId": None,
                "name": "Nexus Demo Widget",
                "color": "#4f46e5",
                "language": "RU",
                "position": "bottom-right",
                "isActive": True,
                "allowedDomains": [],
                "persona": None,
                "greeting": "Здравствуйте! Я демо-ассистент Nexus AI. Чем могу помочь?",
                "leadMode": True,
                "webhookUrl": None,
                "createdAt": "2026-01-01T00:00:00Z",
            },
            {
                "id": "usr_osh_tour_2026",
                "ownerId": None,
                "name": "KG VIP Travel (sandbox)",
                "color": "#6366f1",
                "language": "RU",
                "position": "bottom-right",
                "isActive": True,
                "allowedDomains": [],
                "persona": None,
                "greeting": "Здравствуйте! Я ассистент KG VIP Travel.",
                "leadMode": True,
                "webhookUrl": None,
                "createdAt": "2026-01-01T00:00:00Z",
            },
            {
                "id": "wk_1a2b3c4d5e",
                "ownerId": None,
                "name": "Default Widget",
                "color": "#4f46e5",
                "language": "RU",
                "position": "bottom-right",
                "isActive": True,
                "allowedDomains": [],
                "persona": None,
                "greeting": "Здравствуйте! Чем могу помочь?",
                "leadMode": False,
                "webhookUrl": None,
                "createdAt": "2026-01-01T00:00:00Z",
            },
        ]
        safe_print("[MOCK Supabase] Initialized with 3 seed widgets")

    def table(self, name: str) -> _MockTable:
        return _MockTable(self._store, name)

    def rpc(self, name: str, params: dict) -> _MockResponse:
        """
        Mock RAG retrieval: return up to match_count chunks for the widget,
        ignoring vector math. Lets the dashboard test the end-to-end flow.
        """
        if name == "match_document_chunks":
            widget_id = params.get("p_widget_id")
            match_count = int(params.get("match_count", 4))
            docs = self._store.get("Document", [])
            doc_ids = {
                d["id"]
                for d in docs
                if d.get("widgetId") == widget_id and d.get("status") == "READY"
            }
            chunks = [
                {"id": c["id"], "content": c["content"], "similarity": 0.85}
                for c in self._store.get("DocumentChunk", [])
                if c.get("documentId") in doc_ids
            ][:match_count]
            return _MockResponse(chunks)
        return _MockResponse([])


# ---------------------------------------------------------------------------
# Public factory
# ---------------------------------------------------------------------------
_singleton: Optional[Any] = None


def get_supabase() -> Client:
    """
    Get a Supabase client (singleton). Falls back to MockSupabaseClient if
    credentials are missing or placeholder.
    """
    global _singleton
    if _singleton is not None:
        return _singleton  # type: ignore[return-value]

    try:
        if (
            not SUPABASE_URL
            or not SUPABASE_KEY
            or "your-supabase" in SUPABASE_URL
            or "your-supabase" in SUPABASE_KEY
        ):
            raise ValueError("Placeholder/empty Supabase credentials")
        _singleton = create_client(SUPABASE_URL, SUPABASE_KEY)
        safe_print(f"[Supabase] Connected to {SUPABASE_URL}")
        return _singleton  # type: ignore[return-value]
    except Exception as e:
        safe_print(
            f"[Resilient Mode] Supabase connection failed: {e}. "
            f"Activating MockSupabaseClient (in-memory)."
        )
        _singleton = MockSupabaseClient()
        return _singleton  # type: ignore[return-value]
