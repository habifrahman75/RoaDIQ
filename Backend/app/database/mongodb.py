"""
RoadIQ Backend – app/database/mongodb.py

Async MongoDB connection using Motor.
The client is created lazily on first startup (not at import time)
so missing .env files don't crash the import chain.
"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global _client
    try:
        _client = AsyncIOMotorClient(settings.MONGODB_URI)
        # Ping to confirm connection
        await _client.admin.command("ping")
        logger.info("MongoDB connected to: %s / %s", settings.MONGODB_URI, settings.DATABASE_NAME)
    except Exception as exc:
        logger.error("MongoDB connection failed: %s", exc)
        raise


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed.")


def get_db() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _client[settings.DATABASE_NAME]