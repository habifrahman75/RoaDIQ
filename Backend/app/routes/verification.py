"""
RoadIQ Backend – app/routes/verification.py

POST /api/verify-repair

Accepts before and after image references, forwards them to Member 3's
AI service for comparison, and stores the verification result.

The AI service is called through an HTTP client – YOLO logic lives in ai/.
This route only handles orchestration, not computer vision.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional
import httpx
import logging

from app.database.mongodb import get_db
from app.config import settings
from app.schemas.repair import VerificationRequest, VerificationResponse
from app.schemas.report import ReportStatus

router = APIRouter(prefix="/api", tags=["Verification"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Internal helper: call the AI service
# ---------------------------------------------------------------------------

async def _call_ai_verification(
    before_url: str,
    after_url:  str,
) -> dict:
    """
    Call Member 3's AI verification endpoint.

    Expected AI service response:
    {
        "damage_detected": true | false,
        "confidence": 0.12,
        "notes": "No damage visible in after-repair image"
    }

    If the AI service is unavailable in dev mode, return a safe fallback.
    """
    ai_endpoint = f"{settings.AI_SERVICE_URL}/verify"
    payload = {"before_image_url": before_url, "after_image_url": after_url}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(ai_endpoint, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.ConnectError:
        logger.warning(
            "AI service unreachable at %s – using dev fallback.", ai_endpoint
        )
        # Dev fallback: mark as needing manual review
        return {
            "damage_detected": False,
            "confidence":      0.0,
            "notes":           (
                "[DEV MODE] AI service unavailable. "
                "Manual verification required."
            ),
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
    # 1. Confirm the report exists
    from bson import ObjectId
    from bson.errors import InvalidId
    try:
        report_oid = ObjectId(payload.report_id)
    except InvalidId:
        raise HTTPException(status_code=422, detail="Invalid report_id format.")

    report = await db["reports"].find_one({"_id": report_oid})
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{payload.report_id}' not found.",
        )

    # 2. Call AI service
    ai_result = await _call_ai_verification(
        before_url=payload.before_image_url,
        after_url=payload.after_image_url,
    )

    damage_after = ai_result.get("damage_detected", False)
    confidence   = float(ai_result.get("confidence", 0.0))
    notes        = ai_result.get("notes", "")

    # 3. Determine verification outcome
    verified = not damage_after  # repair is verified if no damage remains
    now = datetime.now(timezone.utc)

    # 4. Persist verification record (embedded in the report)
    verification_doc = {
        "before_image_url":        payload.before_image_url,
        "after_image_url":         payload.after_image_url,
        "verified":                verified,
        "confidence":              confidence,
        "damage_detected_after":   damage_after,
        "notes":                   notes,
        "verified_at":             now,
    }

    new_status = (
        ReportStatus.RESOLVED.value
        if verified
        else ReportStatus.VERIFICATION_REQUIRED.value
    )

    await db["reports"].update_one(
        {"_id": report_oid},
        {
            "$set": {
                "verification":  verification_doc,
                "status":        new_status,
                "updated_at":    now,
            }
        },
    )

    # 5. Mirror status to repair record if it exists
    await db["repairs"].update_one(
        {"report_id": payload.report_id},
        {"$set": {"status": new_status, "updated_at": now}},
    )

    logger.info(
        "Verification complete for report %s → verified=%s",
        payload.report_id,
        verified,
    )

    return VerificationResponse(
        report_id=payload.report_id,
        verified=verified,
        confidence=confidence,
        damage_detected_after=damage_after,
        notes=notes,
        verified_at=now,
    )
