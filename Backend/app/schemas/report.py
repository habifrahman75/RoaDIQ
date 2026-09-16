"""
RoadIQ Backend – app/schemas/report.py

Pydantic models for the Report collection.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class DamageType(str, Enum):
    pothole             = "pothole"
    longitudinal_crack  = "longitudinal_crack"
    transverse_crack    = "transverse_crack"
    alligator_crack     = "alligator_crack"
    damaged_road        = "damaged_road"


class Severity(str, Enum):
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"


class ReportStatus(str, Enum):
    PENDING               = "PENDING"
    ASSIGNED              = "ASSIGNED"
    UNDER_REPAIR          = "UNDER_REPAIR"
    RESOLVED              = "RESOLVED"
    VERIFICATION_REQUIRED = "VERIFICATION_REQUIRED"


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------

class ReportCreate(BaseModel):
    damage_type:      DamageType
    confidence:       float        = Field(..., ge=0.0, le=1.0)
    severity:         Severity
    latitude:         float        = Field(..., ge=-90.0,  le=90.0)
    longitude:        float        = Field(..., ge=-180.0, le=180.0)
    image_url:        Optional[str] = None
    road_segment_id:  Optional[str] = None

    @field_validator("confidence")
    @classmethod
    def round_confidence(cls, v: float) -> float:
        return round(v, 4)


class ReportStatusUpdate(BaseModel):
    status: ReportStatus
    notes:  Optional[str] = None


# ---------------------------------------------------------------------------
# Response bodies
# ---------------------------------------------------------------------------

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class DetectionDetail(BaseModel):
    damage_type: DamageType
    confidence:  float
    severity:    Severity
    bbox:        Optional[BoundingBox] = None


class ReportResponse(BaseModel):
    id:              str
    damage_type:     DamageType
    confidence:      float
    severity:        Severity
    latitude:        float
    longitude:       float
    image_url:       Optional[str]
    road_segment_id: Optional[str]
    priority_score:  float
    status:          ReportStatus
    created_at:      datetime
    updated_at:      datetime


class ReportListResponse(BaseModel):
    total:   int
    page:    int
    limit:   int
    reports: List[ReportResponse]
