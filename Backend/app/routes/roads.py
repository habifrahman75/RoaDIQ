"""
RoadIQ Backend – app/routes/roads.py

GET  /api/road-segments        – List all road segments with health scores
GET  /api/road-segments/{id}   – Single road segment detail
POST /api/road-segments        – Register a new road segment
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from typing import List
import logging

from app.database.mongodb import get_db
from app.schemas.road import (
    RoadSegmentCreate,
    RoadSegmentResponse,
    RoadSegmentListResponse,
)
from app.services.road_health_service import calculate_road_health

router = APIRouter(prefix="/api/road-segments", tags=["Road Segments"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _enrich_segment(doc: dict, db: AsyncIOMotorDatabase) -> RoadSegmentResponse:
    """Compute live health score from active reports and build the response."""
    segment_id = doc["segment_id"]
    active_reports = await db["reports"].find(
        {
            "road_segment_id": segment_id,
            "status":          {"$ne": "RESOLVED"},
        }
    ).to_list(length=None)

    health = calculate_road_health(active_reports)

    return RoadSegmentResponse(
        segment_id=segment_id,
        name=doc.get("name", segment_id),
        health_score=health["health_score"],
        health_label=health["health_label"],
        damage_count=health["damage_count"],
        critical_count=health["critical_count"],
        recent_reports=doc.get("recent_reports", []),
        latitude=doc.get("latitude", 0.0),
        longitude=doc.get("longitude", 0.0),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
    )


# ---------------------------------------------------------------------------
# GET /api/road-segments
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=RoadSegmentListResponse,
    summary="List all road segments with computed health scores",
)
async def list_road_segments(
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs = await db["road_segments"].find({}).to_list(length=None)

    segments = []
    for doc in docs:
        try:
            seg = await _enrich_segment(doc, db)
            segments.append(seg)
        except Exception as exc:
            logger.warning("Failed to enrich segment %s: %s", doc.get("segment_id"), exc)

    return RoadSegmentListResponse(total=len(segments), segments=segments)


# ---------------------------------------------------------------------------
# GET /api/road-segments/{segment_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{segment_id}",
    response_model=RoadSegmentResponse,
    summary="Get a single road segment by its segment_id",
)
async def get_road_segment(
    segment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db["road_segments"].find_one({"segment_id": segment_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Road segment '{segment_id}' not found.",
        )
    return await _enrich_segment(doc, db)


# ---------------------------------------------------------------------------
# POST /api/road-segments
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=RoadSegmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new road segment",
)
async def create_road_segment(
    payload: RoadSegmentCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    existing = await db["road_segments"].find_one({"segment_id": payload.segment_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Road segment '{payload.segment_id}' already exists.",
        )

    now = datetime.now(timezone.utc)
    doc = {
        "segment_id":     payload.segment_id,
        "name":           payload.name,
        "latitude":       payload.latitude,
        "longitude":      payload.longitude,
        "damage_count":   0,
        "recent_reports": [],
        "location": {
            "type":        "Point",
            "coordinates": [payload.longitude, payload.latitude],
        },
        "created_at": now,
        "updated_at": now,
    }
    await db["road_segments"].insert_one(doc)
    logger.info("Road segment created: %s", payload.segment_id)
    return await _enrich_segment(doc, db)
