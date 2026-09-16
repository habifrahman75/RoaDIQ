"""
RoadIQ Backend – app/services/road_health_service.py

Computes the road health score (0–100) for a given road segment
based on all its active (non-RESOLVED) reports.

Thresholds (prototype – not official engineering standards):
  80–100 → GOOD
  60–79  → MODERATE
  40–59  → POOR
   0–39  → CRITICAL
"""

from typing import Any, Dict, List
import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SEVERITY_PENALTY: Dict[str, float] = {
    "CRITICAL": 30.0,
    "HIGH":     20.0,
    "MEDIUM":   10.0,
    "LOW":       5.0,
}

HEALTH_THRESHOLDS = [
    (80, "GOOD"),
    (60, "MODERATE"),
    (40, "POOR"),
    (0,  "CRITICAL"),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _health_label(score: float) -> str:
    for threshold, label in HEALTH_THRESHOLDS:
        if score >= threshold:
            return label
    return "CRITICAL"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_road_health(reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate the road health score for a segment.

    Parameters
    ----------
    reports : list of report dicts from MongoDB (only active / non-resolved)

    Returns
    -------
    dict with:
        health_score  – float 0–100
        health_label  – str (GOOD / MODERATE / POOR / CRITICAL)
        damage_count  – int
        critical_count – int
        penalty_breakdown – list of contributing factors
    """
    if not reports:
        return {
            "health_score":      100.0,
            "health_label":      "GOOD",
            "damage_count":      0,
            "critical_count":    0,
            "penalty_breakdown": [],
        }

    total_penalty = 0.0
    critical_count = 0
    breakdown = []

    for report in reports:
        severity = report.get("severity", "LOW").upper()
        penalty  = SEVERITY_PENALTY.get(severity, 5.0)
        confidence = float(report.get("confidence", 1.0))
        # Scale penalty by confidence (uncertain detections penalise less)
        adjusted = round(penalty * confidence, 2)

        total_penalty += adjusted
        if severity == "CRITICAL":
            critical_count += 1

        breakdown.append({
            "report_id":  str(report.get("_id", "")),
            "severity":   severity,
            "base_penalty": penalty,
            "confidence": confidence,
            "adjusted_penalty": adjusted,
        })

    # Cap penalty at 100 so health score never goes below 0
    health_score = max(0.0, round(100.0 - total_penalty, 1))
    label = _health_label(health_score)

    return {
        "health_score":      health_score,
        "health_label":      label,
        "damage_count":      len(reports),
        "critical_count":    critical_count,
        "penalty_breakdown": breakdown,
    }


def aggregate_network_health(segment_scores: List[float]) -> float:
    """
    Compute a single network-level road health score from
    a list of per-segment scores.
    Returns the average, rounded to one decimal place.
    Returns 100.0 if no segments exist.
    """
    if not segment_scores:
        return 100.0
    return round(sum(segment_scores) / len(segment_scores), 1)
