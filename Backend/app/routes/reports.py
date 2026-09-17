"""
RoadIQ Backend – app/routes/reports.py

POST /api/reports          – Submit a new damage report (JSON body)
POST /api/reports/analyze  – Upload image for AI detection (multipart)
GET  /api/reports          – List reports with filters + pagination
GET  /api/reports/{id}     – Single report detail
PUT  /api/reports/{id}/status – Update repair status
"""

import httpx
import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import (
    APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status,
)
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.database.mongodb import get_db
from app.schemas.report import (
    ReportCreate, ReportListResponse, ReportResponse,
    ReportStatus, ReportStatusUpdate,
)
from app.services.priority_service import calculate_priority_score

router = APIRouter(prefix="/api/reports", tags=["Reports"])
logger = logging.getLogger(__name__)

# Dev-mock AI result returned when the AI service is unreachable
_DEV_MOCK_RESULT = {
    "damage_detected": True,
    "detections": [
        {
            "damage_type": "pothole",
            "confidence":  0.87,
            "severity":    "HIGH",
            "bbox":        [80, 100, 420, 360],
        }
    ],
    "_source": "DEV_MOCK – AI service unavailable. Set AI_SERVICE_URL in .env.",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _oid(report_id: str) -> ObjectId:
    try:
        return ObjectId(report_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid report ID format: '{report_id}'",
        )


def _to_response(doc: dict) -> ReportResponse:
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
# POST /api/reports/analyze  (must be registered BEFORE /{id} routes)
# ---------------------------------------------------------------------------

@router.post(
    "/analyze",
    summary="Upload road image for AI damage detection",
)
async def analyze_image(
    image:     UploadFile = File(..., description="Road image (JPEG or PNG)"),
    latitude:  float      = Form(0.0),
    longitude: float      = Form(0.0),
):
    """
    Forwards the uploaded image to the AI microservice (port 8001).
    Falls back to a clearly-labelled dev-mock if the AI service is not running.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=422,
            detail=f"File must be an image. Received: {image.content_type}",
        )

    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=422, detail="Uploaded image is empty.")

    ai_url = f"{settings.AI_SERVICE_URL}/detect"
    logger.info("Forwarding image to AI service: %s", ai_url)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ai_url,
                files={"image": (image.filename, image_bytes, image.content_type)},
                data={"latitude": str(latitude), "longitude": str(longitude)},
            )
            response.raise_for_status()
            return response.json()

    except httpx.ConnectError:
        logger.warning("AI service unreachable at %s – returning dev-mock.", ai_url)
        return _DEV_MOCK_RESULT

    except httpx.HTTPStatusError as exc:
        logger.error("AI service error: %s", exc)
        raise HTTPException(status_code=502, detail=f"AI service error: {exc.response.status_code}")


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
    report_count = 1
    if payload.road_segment_id:
        report_count = await db["reports"].count_documents(
            {"road_segment_id": payload.road_segment_id}
        ) + 1

    priority_result = calculate_priority_score(
        severity=payload.severity.value,
        damage_type=payload.damage_type.value,
        report_count=report_count,
        confidence=payload.confidence,
    )

    now = datetime.now(timezone.utc)
    doc = {
        "damage_type":     payload.damage_type.value,
        "confidence":      payload.confidence,
        "severity":        payload.severity.value,
        "latitude":        payload.latitude,
        "longitude":       payload.longitude,
        "image_url":       payload.image_url,
        "road_segment_id": payload.road_segment_id,
        "priority_score":  priority_result["priority_score"],
        "priority_reason": priority_result["reason"],
        "status":          ReportStatus.PENDING.value,
        "location": {
            "type": "Point",
            "coordinates": [payload.longitude, payload.latitude],
        },
        "created_at": now,
        "updated_at": now,
    }

    result = await db["reports"].insert_one(doc)
    doc["_id"] = result.inserted_id

    if payload.road_segment_id:
        await db["road_segments"].update_one(
            {"segment_id": payload.road_segment_id},
            {
                "$inc": {"damage_count": 1},
                "$push": {
                    "recent_reports": {
                        "$each": [str(result.inserted_id)],
                        "$slice": -5,
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
    severity:    Optional[str] = Query(None),
    damage_type: Optional[str] = Query(None),
    status:      Optional[str] = Query(None),
    page:        int           = Query(1, ge=1),
    limit:       int           = Query(20, ge=1, le=100),
    db:          AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict = {}

    if severity:
        s = severity.upper()
        if s not in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}:
            raise HTTPException(status_code=422, detail=f"Invalid severity: {severity}")
        query["severity"] = s

    if damage_type:
        valid_dt = {"pothole", "longitudinal_crack", "transverse_crack", "alligator_crack", "damaged_road"}
        if damage_type.lower() not in valid_dt:
            raise HTTPException(status_code=422, detail=f"Invalid damage_type: {damage_type}")
        query["damage_type"] = damage_type.lower()

    if status:
        valid_st = {s.value for s in ReportStatus}
        if status.upper() not in valid_st:
            raise HTTPException(status_code=422, detail=f"Invalid status: {status}")
        query["status"] = status.upper()

    skip = (page - 1) * limit
    total = await db["reports"].count_documents(query)
    docs = await db["reports"].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)

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
    doc = await db["reports"].find_one({"_id": _oid(report_id)})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")
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
    oid = _oid(report_id)
    now = datetime.now(timezone.utc)

    update_fields: dict = {"status": payload.status.value, "updated_at": now}
    if payload.notes:
        update_fields["notes"] = payload.notes

    result = await db["reports"].update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")

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
    logger.info("Report %s status -> %s", report_id, payload.status.value)
    return _to_response(doc)
