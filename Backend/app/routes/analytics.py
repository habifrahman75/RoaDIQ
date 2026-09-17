"""
RoadIQ Backend – app/routes/analytics.py

GET /api/analytics – Time-series and breakdown analytics for the dashboard
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.database.mongodb import get_db

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
logger = logging.getLogger(__name__)


class DailyCount(BaseModel):
    date:  str
    count: int


class TypeBreakdown(BaseModel):
    damage_type: str
    count:       int


class AnalyticsResponse(BaseModel):
    daily_reports:      List[DailyCount]
    type_breakdown:     List[TypeBreakdown]
    severity_breakdown: List[dict]
    total_reports:      int
    resolved_count:     int
    pending_count:      int


@router.get("", response_model=AnalyticsResponse, summary="Analytics data for the authority dashboard")
async def get_analytics(db: AsyncIOMotorDatabase = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    # Daily counts (last 30 days)
    daily_raw = await db["reports"].aggregate([
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {
            "_id":   {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]).to_list(length=None)

    # Damage type breakdown
    type_raw = await db["reports"].aggregate([
        {"$group": {"_id": "$damage_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]).to_list(length=None)

    # Severity breakdown
    sev_raw = await db["reports"].aggregate([
        {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]).to_list(length=None)

    total_reports  = await db["reports"].count_documents({})
    resolved_count = await db["reports"].count_documents({"status": "RESOLVED"})
    pending_count  = await db["reports"].count_documents({"status": "PENDING"})

    return AnalyticsResponse(
        daily_reports=[DailyCount(date=d["_id"], count=d["count"]) for d in daily_raw],
        type_breakdown=[TypeBreakdown(damage_type=d["_id"] or "unknown", count=d["count"]) for d in type_raw],
        severity_breakdown=[{"severity": d["_id"] or "UNKNOWN", "count": d["count"]} for d in sev_raw],
        total_reports=total_reports,
        resolved_count=resolved_count,
        pending_count=pending_count,
    )
