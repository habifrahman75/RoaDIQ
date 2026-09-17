"""
RoadIQ Backend – app/main.py

FastAPI application entry point.
Start from the Backend/ directory:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys

from app.config import settings
from app.database.mongodb import connect_db, close_db
from app.routes import (
    dashboard, reports, roads, priority, repairs, verification,
    analytics, notifications, contributors, recurring,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("RoadIQ backend starting...")
    await connect_db()
    yield
    await close_db()
    logger.info("RoadIQ backend stopped.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="RoadIQ API",
    description=(
        "AI-Powered Road Health & Maintenance Intelligence Platform. "
        "Provides damage reporting, road health scoring, priority queuing, "
        "repair management, and before/after AI verification."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global error handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(roads.router)
app.include_router(roads.router_alias)   # /api/roads alias
app.include_router(priority.router)
app.include_router(repairs.router)
app.include_router(verification.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(contributors.router)
app.include_router(recurring.router)


# ---------------------------------------------------------------------------
# Health & Root
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "RoadIQ Backend", "version": "1.0.0"}


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to RoadIQ API",
        "docs":    "/docs",
        "health":  "/health",
    }
