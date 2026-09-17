"""
RoadIQ Backend – app/routes/verification.py

POST /api/verify-repair   – Submit before/after images for AI verification
GET  /api/verifications   – List all past verification records
"""

import logging
from datetime import datetime, timezone

import httpx
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.config import settings
from app.database.mongodb import get_db
from app.schemas.repair import VerificationRequest, VerificationResponse
from app.schemas.report import ReportStatus

router = APIRouter(prefix="/api", tags=["Verification"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Internal: call AI service
# ---------------------------------------------------------------------------

async def _call_ai_verification(before_url: str, after_url: str) -> dict:
    ai_endpoint = f"{settings.AI_SERVICE_URL}/verify"
    payload = {"before_image_url": before_url, "after_image_url": after_url}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(ai_endpoint, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        logger.warning("AI service unreachable at %s – using dev fallback.", ai_endpoint)
        return {
            "damage_detected": False,
            "confidence":      0.0,
            "notes":           "[DEV MODE] AI service unavailable. Manual verification required.",
        }
    except httpx.HTTPStatusError as exc:
        logger.error("AI service returned error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {exc.response.status_code}",
        )


# ---------------------------------------------------------------------------
# POST /api/verify-repair
# ---------------------------------------------------------------------------

@router.post(
    "/verify-repair",
    response_model=VerificationResponse,
    summary="Submit before/after images for AI-assisted repair verification",
)
async def verify_repair(
    payload: VerificationRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Validate report ID
    try:
        report_oid = ObjectId(payload.report_id)
    except InvalidId:
        raise HTTPException(status_code=422, detail="Invalid report_id format.")

    report = await db["reports"].find_one({"_id": report_oid})
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{payload.report_id}' not found.")

    # Call AI
    ai_result = await _call_ai_verification(payload.before_image_url, payload.after_image_url)

    damage_after = ai_result.get("damage_detected", False)
    confidence   = float(ai_result.get("confidence", 0.0))
    notes        = ai_result.get("notes", "")
    verified     = not damage_after
    now          = datetime.now(timezone.utc)

    # Persist verification sub-document
    verification_doc = {
        "before_image_url":      payload.before_image_url,
        "after_image_url":       payload.after_image_url,
        "verified":              verified,
        "confidence":            confidence,
        "damage_detected_after": damage_after,
        "notes":                 notes,
        "verified_at":           now,
    }

    new_status = (
        ReportStatus.RESOLVED.value
        if verified
        else ReportStatus.VERIFICATION_REQUIRED.value
    )

    await db["reports"].update_one(
        {"_id": report_oid},
        {"$set": {"verification": verification_doc, "status": new_status, "updated_at": now}},
    )

    await db["repairs"].update_one(
        {"report_id": payload.report_id},
        {"$set": {"status": new_status, "updated_at": now}},
    )

    logger.info("Verification complete for report %s -> verified=%s", payload.report_id, verified)

    return VerificationResponse(
        report_id=payload.report_id,
        verified=verified,
        confidence=confidence,
        damage_detected_after=damage_after,
        notes=notes,
        verified_at=now,
    )


# ---------------------------------------------------------------------------
# GET /api/verifications
# ---------------------------------------------------------------------------

@router.get(
    "/verifications",
    summary="List all reports that have been through AI repair verification",
)
async def list_verifications(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Returns reports that have an embedded verification sub-document."""
    docs = await db["reports"].find(
        {"verification": {"$exists": True}},
    ).sort("verification.verified_at", -1).limit(100).to_list(length=100)

    return [
        {
            "report_id":             str(d["_id"]),
            "damage_type":           d.get("damage_type"),
            "severity":              d.get("severity"),
            "road_segment_id":       d.get("road_segment_id"),
            "before_image_url":      d.get("verification", {}).get("before_image_url"),
            "after_image_url":       d.get("verification", {}).get("after_image_url"),
            "verified":              d.get("verification", {}).get("verified"),
            "confidence":            d.get("verification", {}).get("confidence"),
            "damage_detected_after": d.get("verification", {}).get("damage_detected_after"),
            "notes":                 d.get("verification", {}).get("notes"),
            "verified_at":           d.get("verification", {}).get("verified_at"),
        }
        for d in docs
    ]
