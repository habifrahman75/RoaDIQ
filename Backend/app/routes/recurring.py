"""
RoadIQ Backend – app/routes/recurring.py

GET /api/recurring-damage – Road segments with 3+ active damage reports
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.database.mongodb import get_db

router = APIRouter(prefix="/api/recurring-damage", tags=["Recurring Damage"])
logger = logging.getLogger(__name__)

SEV_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]


class RecurringSegment(BaseModel):
    segment_id:     str
    name:           Optional[str] = None
    report_count:   int
    dominant_type:  Optional[str] = None
    worst_severity: Optional[str] = None
    latitude:       float
    longitude:      float


@router.get("", response_model=List[RecurringSegment], summary="Road segments with recurring damage hotspots")
async def get_recurring_damage(
    min_reports: int = Query(3, ge=1),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    pipeline = [
        {"$match": {
            "status":          {"$ne": "RESOLVED"},
            "road_segment_id": {"$exists": True, "$ne": None},
        }},
        {"$group": {
            "_id":          "$road_segment_id",
            "report_count": {"$sum": 1},
            "severities":   {"$push": "$severity"},
            "types":        {"$push": "$damage_type"},
        }},
        {"$match": {"report_count": {"$gte": min_reports}}},
        {"$sort": {"report_count": -1}},
    ]

    groups = await db["reports"].aggregate(pipeline).to_list(length=None)
    results: List[RecurringSegment] = []

    for g in groups:
        seg_id  = g["_id"]
        seg_doc = await db["road_segments"].find_one({"segment_id": seg_id})
        lat     = seg_doc.get("latitude", 0.0) if seg_doc else 0.0
        lon     = seg_doc.get("longitude", 0.0) if seg_doc else 0.0
        name    = seg_doc.get("name", seg_id) if seg_doc else seg_id

        types      = g.get("types", [])
        severities = g.get("severities", [])
        dominant   = max(set(types), key=types.count) if types else None
        worst      = next((s for s in SEV_ORDER if s in severities), None)

        results.append(RecurringSegment(
            segment_id=seg_id,
            name=name,
            report_count=g["report_count"],
            dominant_type=dominant,
            worst_severity=worst,
            latitude=lat,
            longitude=lon,
        ))

    return results
