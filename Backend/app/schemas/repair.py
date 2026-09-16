"""
RoadIQ Backend – app/schemas/repair.py

Pydantic models for the Repairs collection and verification flow.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.report import ReportStatus


# ---------------------------------------------------------------------------
# Repair record (stored in repairs collection)
# ---------------------------------------------------------------------------

class RepairCreate(BaseModel):
    report_id:   str
    assigned_to: Optional[str] = None
    notes:       Optional[str] = None


class RepairResponse(BaseModel):
    id:          str
    report_id:   str
    assigned_to: Optional[str]
    status:      ReportStatus
    assigned_at: datetime
    resolved_at: Optional[datetime]
    notes:       Optional[str]


# ---------------------------------------------------------------------------
# Before/After verification
# ---------------------------------------------------------------------------

class VerificationRequest(BaseModel):
    report_id:        str
    before_image_url: str
    after_image_url:  str


class VerificationResponse(BaseModel):
    report_id:          str
    verified:           bool
    confidence:         float
    damage_detected_after: bool
    notes:              str
    verified_at:        datetime
