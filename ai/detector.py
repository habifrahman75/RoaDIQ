"""
RoadIQ AI Service – ai/detector.py

Primary road damage detector.

Usage:
    from detector import detect, DetectionResult

When AI_MOCK_MODE=true (or the YOLO model file is unavailable), this module
returns a clearly-labelled synthetic result so the demo can run end-to-end
without a GPU or a trained model.

When a real model is available:
    1. Set AI_MODEL_PATH=models/roadiq_yolo.pt in ai/.env
    2. Set AI_MOCK_MODE=false
    3. The detector will load the model via ultralytics.YOLO and run real inference.

Supported classes (can be extended by updating CLASS_MAP):
    0 → pothole
    1 → longitudinal_crack
    2 → transverse_crack
    3 → alligator_crack
    4 → damaged_road
"""

import os
import io
import logging
from dataclasses import dataclass, field
from typing import List, Optional

# Load .env from the ai/ directory (optional, no-op if not present)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
from config import MOCK_MODE as AI_MOCK_MODE, MODEL_PATH, CONF_THRESHOLD, CLASS_MAP


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class Detection:
    damage_type: str
    confidence:  float
    severity:    str
    bbox:        List[int]   # [x1, y1, x2, y2]


@dataclass
class DetectionResult:
    damage_detected: bool
    detections:      List[Detection] = field(default_factory=list)
    source:          str = "real"    # "real" | "mock"


# ---------------------------------------------------------------------------
# Severity estimation (delegated to severity.py)
# ---------------------------------------------------------------------------

def _estimate_severity(confidence: float, bbox: List[int]) -> str:
    # severity.py lives alongside detector.py in the same ai/ directory
    from severity import estimate_severity  # noqa: E402
    img_area = 640 * 640           # assume standard 640×640 inference size
    x1, y1, x2, y2 = bbox
    bbox_area = max((x2 - x1) * (y2 - y1), 1)
    ratio = bbox_area / img_area
    return estimate_severity(confidence, ratio)


# ---------------------------------------------------------------------------
# Real YOLO inference (only imported when not in mock mode)
# ---------------------------------------------------------------------------

_model = None   # lazy-loaded singleton

def _load_model():
    global _model
    if _model is not None:
        return _model
    try:
        from ultralytics import YOLO   # type: ignore
        _model = YOLO(MODEL_PATH)
        logger.info("YOLO model loaded from %s", MODEL_PATH)
        return _model
    except ImportError:
        raise RuntimeError(
            "ultralytics is not installed.  "
            "Run: pip install ultralytics  or set AI_MOCK_MODE=true"
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to load YOLO model from '{MODEL_PATH}': {exc}")


def _run_yolo(image_bytes: bytes) -> DetectionResult:
    from PIL import Image    # type: ignore

    model = _load_model()
    img   = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = model(img, conf=CONF_THRESHOLD, verbose=False)

    detections: List[Detection] = []
    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            cls_idx = int(box.cls[0].item())
            conf    = round(float(box.conf[0].item()), 4)
            xyxy    = [int(v) for v in box.xyxy[0].tolist()]
            dtype   = CLASS_MAP.get(cls_idx, "damaged_road")
            sev     = _estimate_severity(conf, xyxy)
            detections.append(Detection(
                damage_type=dtype,
                confidence=conf,
                severity=sev,
                bbox=xyxy,
            ))

    return DetectionResult(
        damage_detected=len(detections) > 0,
        detections=detections,
        source="real",
    )


# ---------------------------------------------------------------------------
# Mock result (dev fallback — clearly labelled)
# ---------------------------------------------------------------------------

def _mock_result() -> DetectionResult:
    logger.warning(
        "[DEV MOCK] AI_MOCK_MODE=true — returning synthetic detection. "
        "Set AI_MOCK_MODE=false and AI_MODEL_PATH to use a real model."
    )
    return DetectionResult(
        damage_detected=True,
        detections=[
            Detection(
                damage_type="pothole",
                confidence=0.87,
                severity="HIGH",
                bbox=[80, 100, 420, 360],
            )
        ],
        source="mock",
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def detect(image_bytes: bytes) -> DetectionResult:
    """
    Run road damage detection on raw image bytes.

    Parameters
    ----------
    image_bytes : bytes
        Raw binary content of the uploaded image (JPEG / PNG).

    Returns
    -------
    DetectionResult
        damage_detected flag + list of Detection objects.
    """
    if AI_MOCK_MODE:
        return _mock_result()

    try:
        return _run_yolo(image_bytes)
    except Exception as exc:
        logger.error("YOLO inference failed: %s. Falling back to mock.", exc)
        result = _mock_result()
        result.source = f"mock_fallback:{exc}"
        return result
