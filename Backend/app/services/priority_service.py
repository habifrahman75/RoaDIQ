"""
RoadIQ Backend – app/services/priority_service.py

Calculates an explainable priority score (0–100) for a road segment or
individual report.

Priority Score = normalize(Severity Score × Frequency Score × Safety Factor)

This is a prototype formula for the hackathon MVP.
It is NOT an official government or engineering standard.
"""

from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Severity weights
# ---------------------------------------------------------------------------
SEVERITY_WEIGHTS: Dict[str, float] = {
    "CRITICAL": 1.0,
    "HIGH":     0.75,
    "MEDIUM":   0.50,
    "LOW":      0.25,
}

# Damage type risk multipliers
DAMAGE_RISK: Dict[str, float] = {
    "pothole":            1.0,
    "alligator_crack":    0.9,
    "damaged_road":       0.85,
    "transverse_crack":   0.6,
    "longitudinal_crack": 0.5,
}


# ---------------------------------------------------------------------------
# Core calculation helpers
# ---------------------------------------------------------------------------

def _severity_score(severity: str) -> float:
    """Return a 0–1 severity score."""
    return SEVERITY_WEIGHTS.get(severity.upper(), 0.25)


def _frequency_score(report_count: int, max_count: int = 20) -> float:
    """
    Normalise report frequency to 0–1.
    Caps at max_count to avoid outliers dominating the score.
    """
    capped = min(report_count, max_count)
    return capped / max_count


def _damage_risk_factor(damage_type: str) -> float:
    """Return the risk multiplier for the damage type (0–1)."""
    return DAMAGE_RISK.get(damage_type.lower(), 0.5)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_priority_score(
    severity:     str,
    damage_type:  str,
    report_count: int,
    confidence:   float = 1.0,
) -> Dict[str, Any]:
    """
    Calculate the priority score for a single report or road segment.

    Returns a dict with the raw component scores, the final priority_score
    (0–100), and a human-readable reason string.

    Parameters
    ----------
    severity      : Severity string – CRITICAL / HIGH / MEDIUM / LOW
    damage_type   : Damage type string (see DAMAGE_RISK mapping)
    report_count  : Number of reports on the same segment (for frequency)
    confidence    : AI detection confidence (0.0–1.0); default 1.0
    """
    sev_score  = _severity_score(severity)
    freq_score = _frequency_score(report_count)
    risk_factor = _damage_risk_factor(damage_type)

    # Weighted composite (confidence is used as a reliability multiplier)
    raw = sev_score * 0.5 + freq_score * 0.3 + risk_factor * 0.2
    raw *= confidence  # scale down uncertain detections

    # Normalise to 0–100 and round
    priority_score = round(min(raw * 100, 100.0), 1)

    reason = (
        f"Severity '{severity}' (weight={sev_score:.2f}), "
        f"{report_count} report(s) on segment (freq={freq_score:.2f}), "
        f"damage type '{damage_type}' risk factor {risk_factor:.2f}, "
        f"AI confidence {confidence:.2f}."
    )

    return {
        "priority_score":   priority_score,
        "severity_score":   round(sev_score  * 100, 1),
        "frequency_score":  round(freq_score * 100, 1),
        "risk_factor":      round(risk_factor * 100, 1),
        "confidence":       confidence,
        "reason":           reason,
    }


def recalculate_segment_priority(reports: list) -> Dict[str, Any]:
    """
    Aggregate priority across all active reports on a road segment.

    Takes the highest individual priority and blends it with the segment
    average, giving more weight to the worst case.
    """
    if not reports:
        return {
            "priority_score":  0.0,
            "severity_score":  0.0,
            "frequency_score": 0.0,
            "reason":          "No active reports on this segment.",
        }

    scores = []
    for r in reports:
        result = calculate_priority_score(
            severity=r.get("severity", "LOW"),
            damage_type=r.get("damage_type", "pothole"),
            report_count=len(reports),
            confidence=float(r.get("confidence", 1.0)),
        )
        scores.append(result["priority_score"])

    max_score = max(scores)
    avg_score = sum(scores) / len(scores)
    # Blend: 70% worst case + 30% average
    blended = round(max_score * 0.7 + avg_score * 0.3, 1)

    return {
        "priority_score":  blended,
        "severity_score":  max_score,
        "frequency_score": round(_frequency_score(len(reports)) * 100, 1),
        "report_count":    len(reports),
        "reason": (
            f"Segment has {len(reports)} active report(s). "
            f"Worst priority {max_score}, average {avg_score:.1f}. "
            f"Blended score (70% worst + 30% avg)."
        ),
    }
