"""
SaaS AI Core — FastAPI backend for the embeddable Nexus AI widget.

Run:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import chat, ingest, leads
from app.core.config import ALLOWED_ORIGINS, APP_VERSION

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai-core")

app = FastAPI(
    title="Nexus AI Core",
    description=(
        "Backend API for the embeddable Nexus AI widget. "
        "Handles RAG, embeddings, chat streaming and lead capture."
    ),
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request logging + timing
# ---------------------------------------------------------------------------
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    duration = (time.perf_counter() - started) * 1000
    response.headers["X-Process-Time-Ms"] = f"{duration:.1f}"
    logger.info(
        "%s %s -> %s (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response


# ---------------------------------------------------------------------------
# Global exception handler — никогда не возвращаем сырой stacktrace клиенту
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "detail": "Something went wrong."},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["Ingest"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(leads.router, prefix="/api/v1/leads", tags=["Leads"])


@app.get("/")
def root():
    return {"name": "Nexus AI Core", "version": APP_VERSION, "status": "ok"}


@app.get("/health")
def health():
    """Liveness/readiness probe."""
    return {"status": "ok", "version": APP_VERSION}
