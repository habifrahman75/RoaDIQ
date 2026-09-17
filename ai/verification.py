"""
RoadIQ AI Service – ai/verification.py

Before / after repair verification.

Compares a before-repair image and an after-repair image to determine
whether visible damage has been resolved.

Strategy (MVP prototype):
  - In MOCK mode: returns a configurable synthetic result.
  - In REAL mode: runs YOLO detection on the after image and considers
    the repair verified if no damage is detected above the confidence
    threshold.

The before image URL is logged for audit purposes but is not required for
the comparison logic in the MVP (a single-image detection on the after
image is sufficient to judge repair success).
"""

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

from config import MOCK_MODE as AI_MOCK_MODE, CONF_THRESHOLD


@dataclass
class VerificationResult:
    damage_detected: bool   # True = damage still visible → not verified
    confidence:      float  # Highest detection confidence in after image
    verified:        bool   # not damage_detected
    notes:           str
    source:          str    # "real" | "mock"


def _mock_verification(before_url: str, after_url: str) -> VerificationResult:
    logger.warning(
        "[DEV MOCK] Verification in mock mode – returning synthetic pass result."
    )
    return VerificationResult(
        damage_detected=False,
        confidence=0.12,
        verified=True,
        notes=(
            "[DEV MOCK] No damage detected in after-repair image (synthetic). "
            "Set AI_MOCK_MODE=false and provide a real YOLO model for live verification."
        ),
        source="mock",
    )


def _real_verification(before_url: str, after_url: str) -> VerificationResult:
    """
    Fetch the after-repair image by URL and run YOLO detection.
    The repair is considered successful if no detections exceed the threshold.
    """
    import httpx
    from detector import detect

    try:
        response = httpx.get(after_url, timeout=15.0)
        response.raise_for_status()
        after_bytes = response.content
    except Exception as exc:
        logger.error("Failed to fetch after-repair image from %s: %s", after_url, exc)
        return VerificationResult(
            damage_detected=False,
            confidence=0.0,
            verified=False,
            notes=f"Could not download after-repair image: {exc}",
            source="error",
        )

    result = detect(after_bytes)

    max_conf = max((d.confidence for d in result.detections), default=0.0)
    still_damaged = result.damage_detected and max_conf >= CONF_THRESHOLD

    if still_damaged:
        types = ", ".join(d.damage_type for d in result.detections)
        notes = (
            f"Damage still detected after repair: {types} "
            f"(max confidence {max_conf:.2f}). Manual inspection recommended."
        )
    else:
        notes = (
            "No significant damage detected in after-repair image. "
            f"Repair appears successful (max conf below threshold: {max_conf:.2f})."
        )

    return VerificationResult(
        damage_detected=still_damaged,
        confidence=max_conf,
        verified=not still_damaged,
        notes=notes,
        source="real",
    )


def compare_before_after(before_url: str, after_url: str) -> VerificationResult:
    """
    Public API: verify whether a repair was successful.

    Parameters
    ----------
    before_url : str  – URL of the original damage image
    after_url  : str  – URL of the post-repair image

    Returns
    -------
    VerificationResult
    """
    logger.info(
        "Verification requested: before=%s  after=%s", before_url, after_url
    )

    if AI_MOCK_MODE:
        return _mock_verification(before_url, after_url)

    try:
        return _real_verification(before_url, after_url)
    except Exception as exc:
        logger.error("Verification failed: %s. Returning mock fallback.", exc)
        result = _mock_verification(before_url, after_url)
        result.source = f"mock_fallback:{exc}"
        return result
