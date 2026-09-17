"""
RoadIQ Backend – app/routes/roads.py

GET  /api/road-segments            – List all road segments
GET  /api/road-segments/{id}       – Single road segment
POST /api/road-segments            – Register a new road segment

Aliases (frontend uses /api/roads):
GET  /api/roads                    – Same as /api/road-segments
GET  /api/roads/{id}               – Same as /api/road-segments/{id}
GET  /api/roads/{id}/history       – Resolved reports (repair history)
GET  /api/roads/{id}/reports       – Active reports on segment
"""

import logging
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongodb import get_db
from app.schemas.road import RoadSegmentCreate, RoadSegmentListResponse, RoadSegmentResponse
from app.schemas.report import ReportResponse
from app.services.road_health_service import calculate_road_health

router       = APIRouter(prefix="/api/road-segments", tags=["Road Segments"])
router_alias = APIRouter(prefix="/api/roads",         tags=["Road Segments"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------

async def _enrich_segment(doc: dict, db: AsyncIOMotorDatabase) -> RoadSegmentResponse:
    """Compute live health score from active reports and build the response."""
    segment_id = doc["segment_id"]
    active_reports = await db["reports"].find(
        {"road_segment_id": segment_id, "status": {"$ne": "RESOLVED"}},
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


def _report_to_response(doc: dict) -> ReportResponse:
    return ReportResponse(
        id=str(doc["_id"]),
        damage_type=doc["damage_type"],
        confidence=doc["confidence"],
        severity=doc["severity"],
        latitude=doc["latitude"],
        longitude=doc["longitude"],
        image_url=doc.get("image_url"),
        road_segment_id=doc.get("road_segment_id"),
        priority_score=doc.get("priority_score", 0.0),
        status=doc["status"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


# ---------------------------------------------------------------------------
# GET /api/road-segments
# ---------------------------------------------------------------------------

@router.get("", response_model=RoadSegmentListResponse, summary="List all road segments")
async def list_road_segments(db: AsyncIOMotorDatabase = Depends(get_db)):
    docs = await db["road_segments"].find({}).to_list(length=None)
    segments = []
    for doc in docs:
        try:
            segments.append(await _enrich_segment(doc, db))
        except Exception as exc:
            logger.warning("Failed to enrich segment %s: %s", doc.get("segment_id"), exc)
    return RoadSegmentListResponse(total=len(segments), segments=segments)


# ---------------------------------------------------------------------------
# GET /api/road-segments/{segment_id}
# ---------------------------------------------------------------------------

@router.get("/{segment_id}", response_model=RoadSegmentResponse, summary="Get a single road segment")
async def get_road_segment(segment_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db["road_segments"].find_one({"segment_id": segment_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Road segment '{segment_id}' not found.")
    return await _enrich_segment(doc, db)


# ---------------------------------------------------------------------------
# POST /api/road-segments
# ---------------------------------------------------------------------------

@router.post("", response_model=RoadSegmentResponse, status_code=status.HTTP_201_CREATED,
             summary="Register a new road segment")
async def create_road_segment(payload: RoadSegmentCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db["road_segments"].find_one({"segment_id": payload.segment_id})
    if existing:
        raise HTTPException(status_code=409, detail=f"Road segment '{payload.segment_id}' already exists.")

    now = datetime.now(timezone.utc)
    doc = {
        "segment_id":     payload.segment_id,
        "name":           payload.name,
        "latitude":       payload.latitude,
        "longitude":      payload.longitude,
        "damage_count":   0,
        "recent_reports": [],
        "location": {"type": "Point", "coordinates": [payload.longitude, payload.latitude]},
        "created_at": now,
        "updated_at": now,
    }
    await db["road_segments"].insert_one(doc)
    logger.info("Road segment created: %s", payload.segment_id)
    return await _enrich_segment(doc, db)


# ---------------------------------------------------------------------------
# /api/roads  alias routes
# Note: specific sub-paths (/{id}/history, /{id}/reports) must be registered
# BEFORE the generic /{segment_id} route to avoid path conflicts.
# ---------------------------------------------------------------------------

@router_alias.get("", response_model=RoadSegmentListResponse, summary="[Alias] List all road segments")
async def list_road_segments_alias(db: AsyncIOMotorDatabase = Depends(get_db)):
    return await list_road_segments(db=db)


@router_alias.get("/{segment_id}/history", summary="Repair history for a road segment")
async def get_road_history(segment_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Returns resolved reports for the segment as repair history."""
    docs = await db["reports"].find(
        {"road_segment_id": segment_id, "status": "RESOLVED"},
    ).sort("updated_at", -1).limit(20).to_list(length=20)

    return {
        "segment_id": segment_id,
        "history": [
            {
                "id":          str(d["_id"]),
                "damage_type": d.get("damage_type"),
                "severity":    d.get("severity"),
                "status":      d.get("status"),
                "resolved_at": d.get("updated_at"),
            }
            for d in docs
        ],
    }


@router_alias.get("/{segment_id}/reports", summary="Active reports for a road segment")
async def get_road_reports(segment_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Returns all non-resolved reports for the segment."""
    docs = await db["reports"].find(
        {"road_segment_id": segment_id, "status": {"$ne": "RESOLVED"}},
    ).sort("created_at", -1).limit(50).to_list(length=50)
    return [_report_to_response(d) for d in docs]


@router_alias.get("/{segment_id}", response_model=RoadSegmentResponse, summary="[Alias] Get a single road segment")
async def get_road_segment_alias(segment_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    return await get_road_segment(segment_id=segment_id, db=db)
