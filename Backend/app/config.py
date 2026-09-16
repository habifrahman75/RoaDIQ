"""
RoadIQ Backend – app/config.py

Centralised settings loaded from environment variables / .env file.
All other modules import from here – never import os.environ directly.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── MongoDB ──────────────────────────────────────────────────────────────
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "roadiq"

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # ── AI service ───────────────────────────────────────────────────────────
    AI_SERVICE_URL: str = "http://localhost:8001"

    # ── App ──────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_PORT: int = 8000


settings = Settings()
