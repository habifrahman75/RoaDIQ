"""
RoadIQ Backend – app/routes/reports.py

POST /api/reports        – Submit a new damage report
GET  /api/reports        – List reports (with filters + pagination)
GET  /api/reports/{id}   – Single report detail
PUT  /api/reports/{id}/status – Update repair status
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
from typing import Optional
import logging

from app.database.mongodb import get_db
from app.schemas.report import (
    ReportCreate,
    ReportResponse,
    ReportListResponse,
    ReportStatusUpdate,
    ReportStatus,
)
from app.services.priority_service import calculate_priority_score

router = APIRouter(prefix="/api/reports", tags=["Reports"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_response(doc: dict) -> ReportResponse:
    """Convert a raw MongoDB document to a ReportResponse."""
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


def _valid_object_id(report_id: str) -> ObjectId:
    try:
        return ObjectId(report_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid report ID format: '{report_id}'",
        )


# ---------------------------------------------------------------------------
# POST /api/reports
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new damage report",
)
async def create_report(
    payload: ReportCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Count existing reports on the same segment (for frequency-based priority)
    report_count = 1
    if payload.road_segment_id:
        report_count = await db["reports"].count_documents(
            {"road_segment_id": payload.road_segment_id}
        )
        report_count += 1  # include the one being created

    priority_result = calculate_priority_score(
        severity=payload.severity.value,
        damage_type=payload.damage_type.value,
        report_count=report_count,
        confidence=payload.confidence,
    )

    now = datetime.now(timezone.utc)
    doc = {
        "damage_type":      payload.damage_type.value,
        "confidence":       payload.confidence,
        "severity":         payload.severity.value,
        "latitude":         payload.latitude,
        "longitude":        payload.longitude,
        "image_url":        payload.image_url,
        "road_segment_id":  payload.road_segment_id,
        "priority_score":   priority_result["priority_score"],
        "priority_reason":  priority_result["reason"],
        "status":           ReportStatus.PENDING.value,
        # GeoJSON point for geospatial queries
        "location": {
            "type": "Point",
            "coordinates": [payload.longitude, payload.latitude],
        },
        "created_at": now,
        "updated_at": now,
    }

    result = await db["reports"].insert_one(doc)
    doc["_id"] = result.inserted_id

    # If a road segment is referenced, update its damage count
    if payload.road_segment_id:
        await db["road_segments"].update_one(
            {"segment_id": payload.road_segment_id},
            {
                "$inc": {"damage_count": 1},
                "$push": {
                    "recent_reports": {
                        "$each": [str(result.inserted_id)],
                        "$slice": -5,           # keep last 5
                    }
                },
                "$set": {"updated_at": now},
            },
            upsert=False,
        )

    logger.info("Report created: %s", result.inserted_id)
    return _to_response(doc)


# ---------------------------------------------------------------------------
# GET /api/reports
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=ReportListResponse,
    summary="List damage reports with optional filters and pagination",
)
async def list_reports(
    severity:    Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    damage_type: Optional[str] = Query(None, description="Filter by damage type"),
    status:      Optional[str] = Query(None, description="Filter by status"),
    page:        int           = Query(1, ge=1, description="Page number (1-indexed)"),
    limit:       int           = Query(20, ge=1, le=100, description="Results per page"),
    db:          AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict = {}

    if severity:
        severity_upper = severity.upper()
        valid = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
        if severity_upper not in valid:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid severity. Allowed: {sorted(valid)}",
            )
        query["severity"] = severity_upper

    if damage_type:
        valid_dt = {
            "pothole", "longitudinal_crack", "transverse_crack",
            "alligator_crack", "damaged_road",
        }
        if damage_type.lower() not in valid_dt:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid damage_type. Allowed: {sorted(valid_dt)}",
            )
        query["damage_type"] = damage_type.lower()

    if status:
        valid_st = {s.value for s in ReportStatus}
        if status.upper() not in valid_st:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid status. Allowed: {sorted(valid_st)}",
            )
        query["status"] = status.upper()

    skip = (page - 1) * limit
    total = await db["reports"].count_documents(query)
    cursor = (
        db["reports"]
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)

    return ReportListResponse(
        total=total,
        page=page,
        limit=limit,
        reports=[_to_response(d) for d in docs],
    )


# ---------------------------------------------------------------------------
# GET /api/reports/{report_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{report_id}",
    response_model=ReportResponse,
    summary="Get a single report by ID",
)
async def get_report(
    report_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    oid = _valid_object_id(report_id)
    doc = await db["reports"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found.",
        )
    return _to_response(doc)


# ---------------------------------------------------------------------------
# PUT /api/reports/{report_id}/status
# ---------------------------------------------------------------------------

@router.put(
    "/{report_id}/status",
    response_model=ReportResponse,
    summary="Update the repair status of a report",
)
async def update_report_status(
    report_id: str,
    payload:   ReportStatusUpdate,
    db:        AsyncIOMotorDatabase = Depends(get_db),
):
    oid = _valid_object_id(report_id)
    now = datetime.now(timezone.utc)

    update_fields: dict = {
        "status":     payload.status.value,
        "updated_at": now,
    }
    if payload.notes:
        update_fields["notes"] = payload.notes

    result = await db["reports"].update_one(
        {"_id": oid},
        {"$set": update_fields},
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found.",
        )

    # Create / update the repair record when status changes
    if payload.status.value in ("ASSIGNED", "UNDER_REPAIR", "RESOLVED"):
        repair_update: dict = {
            "report_id": report_id,
            "status":    payload.status.value,
            "updated_at": now,
        }
        if payload.status.value == "RESOLVED":
            repair_update["resolved_at"] = now
        if payload.notes:
            repair_update["notes"] = payload.notes

        await db["repairs"].update_one(
            {"report_id": report_id},
            {"$set": repair_update, "$setOnInsert": {"assigned_at": now}},
            upsert=True,
        )

    doc = await db["reports"].find_one({"_id": oid})
    logger.info("Report %s status → %s", report_id, payload.status.value)
    return _to_response(doc)
