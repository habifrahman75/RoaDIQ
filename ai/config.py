"""
RoadIQ AI Service – ai/config.py

Centralised configuration loaded from environment variables / .env file.
All AI modules should import settings from here instead of calling
os.getenv() directly.

Environment variables (see .env.example):
    AI_MOCK_MODE          – "true" (default) | "false"
    AI_MODEL_PATH         – Relative or absolute path to YOLO .pt weights
    AI_CONF_THRESHOLD     – Min confidence for a valid detection (0.0–1.0)
    AI_PORT               – Port for the AI FastAPI service (default 8001)
    AI_ALLOWED_ORIGINS    – Comma-separated CORS origins
"""

import os

# Load .env from the ai/ directory (no-op if file is missing or dotenv is not installed)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


# ---------------------------------------------------------------------------
# Core switches
# ---------------------------------------------------------------------------

# When True the service returns clearly-labelled synthetic detections without
# loading any model.  Set to "false" only when a trained .pt file is present.
MOCK_MODE: bool = os.getenv("AI_MOCK_MODE", "true").lower() == "true"

# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

# Path to the YOLO .pt weights file (relative to ai/ or absolute).
# Place your trained weights at this location and set AI_MOCK_MODE=false.
MODEL_PATH: str = os.getenv("AI_MODEL_PATH", "models/roadiq_yolo.pt")

# Minimum YOLO confidence score required to include a detection in results.
CONF_THRESHOLD: float = float(os.getenv("AI_CONF_THRESHOLD", "0.35"))

# ---------------------------------------------------------------------------
# Supported damage classes
# Maps YOLO class index → damage type string.
# Extend this dict (and retrain your model) to add new damage categories.
# ---------------------------------------------------------------------------

CLASS_MAP: dict = {
    0: "pothole",
    1: "longitudinal_crack",
    2: "transverse_crack",
    3: "alligator_crack",
    4: "damaged_road",
}

# ---------------------------------------------------------------------------
# Service networking
# ---------------------------------------------------------------------------

PORT: int = int(os.getenv("AI_PORT", "8001"))

ALLOWED_ORIGINS: list = [
    o.strip()
    for o in os.getenv(
        "AI_ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:8000",
    ).split(",")
]
