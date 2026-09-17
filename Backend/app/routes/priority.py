"""
RoadIQ Backend – app/routes/priority.py

GET /api/priority – Priority queue of road segments sorted by urgency
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.database.mongodb import get_db
from app.services.priority_service import recalculate_segment_priority
from app.services.road_health_service import calculate_road_health

router = APIRouter(prefix="/api/priority", tags=["Priority"])
logger = logging.getLogger(__name__)


class SegmentPriorityItem(BaseModel):
    segment_id:      str
    name:            str
    priority_score:  float
    severity_score:  float
    frequency_score: float
    road_health:     float
    report_count:    int
    reason:          str
    latitude:        float
    longitude:       float


class PriorityQueueResponse(BaseModel):
    total: int
    items: List[SegmentPriorityItem]


@router.get("", response_model=PriorityQueueResponse, summary="Priority queue of road segments sorted by urgency")
async def get_priority_queue(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    segments = await db["road_segments"].find({}).to_list(length=None)
    items: List[SegmentPriorityItem] = []

    for seg in segments:
        segment_id = seg["segment_id"]
        active_reports = await db["reports"].find(
            {"road_segment_id": segment_id, "status": {"$nin": ["RESOLVED"]}},
        ).to_list(length=None)

        priority = recalculate_segment_priority(active_reports)
        health   = calculate_road_health(active_reports)

        items.append(SegmentPriorityItem(
            segment_id=segment_id,
            name=seg.get("name", segment_id),
            priority_score=priority["priority_score"],
            severity_score=priority["severity_score"],
            frequency_score=priority["frequency_score"],
            road_health=health["health_score"],
            report_count=priority.get("report_count", len(active_reports)),
            reason=priority["reason"],
            latitude=seg.get("latitude", 0.0),
            longitude=seg.get("longitude", 0.0),
        ))

    items.sort(key=lambda x: x.priority_score, reverse=True)
    items = items[:limit]
    return PriorityQueueResponse(total=len(items), items=items)
