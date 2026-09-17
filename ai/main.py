"""
RoadIQ AI Service – ai/main.py

Standalone FastAPI microservice that exposes the AI detection and
verification capabilities.

Default port: 8001  (configured by AI_PORT env var)

Endpoints:
    GET  /health          – Liveness check
    POST /detect          – Road damage detection from uploaded image
    POST /verify          – Before/after repair verification

Start from the ai/ directory:
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload

Environment variables (see .env.example):
    AI_MOCK_MODE          – "true" (default) | "false"
    AI_MODEL_PATH         – Path to YOLO .pt model file
    AI_CONF_THRESHOLD     – Minimum confidence for a valid detection (default 0.35)
    AI_PORT               – Port to listen on (default 8001)
    AI_ALLOWED_ORIGINS    – Comma-separated CORS origins
"""

import os
import logging
import sys

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Configuration (single source of truth) ────────────────────────────────────
from config import MOCK_MODE as AI_MOCK_MODE, ALLOWED_ORIGINS, PORT as AI_PORT


# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="RoadIQ AI Service",
    description=(
        "YOLO-powered road damage detection microservice. "
        "Set AI_MOCK_MODE=true for development without a GPU or model file."
    ),
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic response models ───────────────────────────────────────────────────

class DetectionItem(BaseModel):
    damage_type: str
    confidence:  float
    severity:    str
    bbox:        List[int]


class DetectResponse(BaseModel):
    damage_detected: bool
    detections:      List[DetectionItem]
    source:          str   # "real" | "mock" | "mock_fallback:..."


class VerifyResponse(BaseModel):
    damage_detected: bool
    confidence:      float
    verified:        bool
    notes:           str
    source:          str


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status":    "ok",
        "service":   "RoadIQ AI Service",
        "version":   "1.0.0",
        "mock_mode": AI_MOCK_MODE,
    }


# ── POST /detect ───────────────────────────────────────────────────────────────

@app.post("/detect", response_model=DetectResponse, tags=["Detection"])
async def detect_damage(
    image:     UploadFile = File(..., description="Road image (JPEG/PNG)"),
    latitude:  float      = Form(0.0,  description="GPS latitude of capture location"),
    longitude: float      = Form(0.0,  description="GPS longitude of capture location"),
):
    """
    Run YOLO road damage detection on the uploaded image.

    - In **MOCK mode** (`AI_MOCK_MODE=true`): returns a synthetic HIGH-severity
      pothole detection labelled with `source: 'mock'`.
    - In **REAL mode**: runs the trained YOLO model and returns all detections
      above the confidence threshold.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=422,
            detail=f"Uploaded file must be an image. Got: {image.content_type}",
        )

    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=422, detail="Uploaded image is empty.")

    logger.info(
        "Detection request: file=%s size=%d bytes lat=%s lon=%s",
        image.filename, len(image_bytes), latitude, longitude,
    )

    from detector import detect, DetectionResult
    result: DetectionResult = detect(image_bytes)

    return DetectResponse(
        damage_detected=result.damage_detected,
        detections=[
            DetectionItem(
                damage_type=d.damage_type,
                confidence=d.confidence,
                severity=d.severity,
                bbox=d.bbox,
            )
            for d in result.detections
        ],
        source=result.source,
    )


# ── POST /verify ───────────────────────────────────────────────────────────────

class VerifyRequest(BaseModel):
    before_image_url: str
    after_image_url:  str


@app.post("/verify", response_model=VerifyResponse, tags=["Verification"])
async def verify_repair(payload: VerifyRequest):
    """
    Compare before and after repair images using AI.

    Returns `verified=true` when no significant road damage is detected
    in the after-repair image.
    """
    from verification import compare_before_after
    result = compare_before_after(
        before_url=payload.before_image_url,
        after_url=payload.after_image_url,
    )
    return VerifyResponse(
        damage_detected=result.damage_detected,
        confidence=result.confidence,
        verified=result.verified,
        notes=result.notes,
        source=result.source,
    )


# ── Global error handler ───────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def _unhandled(request, exc):
    logger.error("Unhandled error on %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal AI service error. Please try again."},
    )


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=AI_PORT, reload=True)
