"""
RoadIQ Backend – app/schemas/road.py

Pydantic models for the Road Segment collection.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RoadSegmentBase(BaseModel):
    name:      str
    latitude:  float = Field(..., ge=-90.0,  le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class RoadSegmentCreate(RoadSegmentBase):
    segment_id: str


class RoadSegmentResponse(BaseModel):
    segment_id:     str
    name:           str
    health_score:   float          # 0–100
    health_label:   str            # GOOD / MODERATE / POOR / CRITICAL
    damage_count:   int
    critical_count: int
    recent_reports: List[str]      # last 5 report IDs
    latitude:       float
    longitude:      float
    updated_at:     datetime


class RoadSegmentListResponse(BaseModel):
    total:    int
    segments: List[RoadSegmentResponse]
