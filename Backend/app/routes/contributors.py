"""
RoadIQ Backend – app/routes/contributors.py

GET /api/contributors/{user_id}/stats – Activity stats for a contributor
"""

import logging

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.database.mongodb import get_db

router = APIRouter(prefix="/api/contributors", tags=["Contributors"])
logger = logging.getLogger(__name__)


class ContributorStats(BaseModel):
    user_id:           str
    points:            int
    reports_submitted: int
    ai_verified:       int
    resolved:          int
    needs_evidence:    int
    under_review:      int
    under_repair:      int


@router.get("/{user_id}/stats", response_model=ContributorStats, summary="Activity stats for a contributor")
async def get_contributor_stats(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Returns aggregate report statistics.
    NOTE: In this MVP, reports are not tied to a user_id.
    Stats reflect the full collection as a demonstration.
    Add a 'submitted_by' field to reports when real auth is implemented.
    """
    total     = await db["reports"].count_documents({})
    resolved  = await db["reports"].count_documents({"status": "RESOLVED"})
    assigned  = await db["reports"].count_documents({"status": "ASSIGNED"})
    under_rep = await db["reports"].count_documents({"status": "UNDER_REPAIR"})
    verified  = await db["reports"].count_documents({"verification": {"$exists": True}})
    points    = total * 10 + resolved * 5

    return ContributorStats(
        user_id=user_id,
        points=points,
        reports_submitted=total,
        ai_verified=verified,
        resolved=resolved,
        needs_evidence=0,
        under_review=assigned,
        under_repair=under_rep,
    )
