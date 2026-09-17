"""
RoadIQ AI Service – ai/severity.py

Estimates a visible severity label (LOW / MEDIUM / HIGH / CRITICAL) from
two proxy signals available in a standard RGB image:

  1. AI confidence — higher confidence usually correlates with more distinct,
     larger damage.
  2. Bounding box area ratio — a larger detection area relative to the frame
     indicates more extensive damage.

IMPORTANT: This is a prototype heuristic for the hackathon MVP.
It does NOT measure actual physical depth, structural integrity, or load
capacity of the road.  Severity labels are estimated from image evidence only.
"""


def estimate_severity(confidence: float, bbox_area_ratio: float) -> str:
    """
    Estimate damage severity from confidence and bounding-box area ratio.

    Parameters
    ----------
    confidence      : float  – AI detection confidence (0.0–1.0)
    bbox_area_ratio : float  – (bbox_w * bbox_h) / (frame_w * frame_h), 0.0–1.0

    Returns
    -------
    str : "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    """
    # Composite signal: 60% confidence weight + 40% area weight
    score = confidence * 0.6 + min(bbox_area_ratio * 5.0, 1.0) * 0.4

    if score >= 0.80:
        return "CRITICAL"
    elif score >= 0.60:
        return "HIGH"
    elif score >= 0.35:
        return "MEDIUM"
    else:
        return "LOW"


def severity_to_score(severity: str) -> float:
    """Convert severity label to a 0–1 numeric weight for priority scoring."""
    mapping = {
        "CRITICAL": 1.00,
        "HIGH":     0.75,
        "MEDIUM":   0.50,
        "LOW":      0.25,
    }
    return mapping.get(severity.upper(), 0.25)
