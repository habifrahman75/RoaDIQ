"""
RoadIQ Backend – app/routes/notifications.py

GET /api/notifications – Recent system notifications derived from reports
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.database.mongodb import get_db

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
logger = logging.getLogger(__name__)


class NotificationItem(BaseModel):
    id:         str
    type:       str
    title:      str
    message:    str
    report_id:  str
    created_at: datetime


@router.get("", response_model=List[NotificationItem], summary="Recent system notifications")
async def get_notifications(db: AsyncIOMotorDatabase = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
    items: List[NotificationItem] = []

    # New CRITICAL reports in last 48 h
    critical_docs = await db["reports"].find(
        {"severity": "CRITICAL", "created_at": {"$gte": cutoff}},
    ).sort("created_at", -1).limit(15).to_list(length=15)

    for d in critical_docs:
        items.append(NotificationItem(
            id=f"crit-{d['_id']}",
            type="new_critical",
            title="Critical damage reported",
            message=(
                f"A CRITICAL {d.get('damage_type', 'damage')} was detected "
                f"on segment {d.get('road_segment_id', 'unknown')}."
            ),
            report_id=str(d["_id"]),
            created_at=d["created_at"],
        ))

    # Recent status changes
    status_docs = await db["reports"].find(
        {
            "status":     {"$in": ["RESOLVED", "ASSIGNED", "VERIFICATION_REQUIRED"]},
            "updated_at": {"$gte": cutoff},
        },
    ).sort("updated_at", -1).limit(15).to_list(length=15)

    for d in status_docs:
        st = d.get("status", "")
        items.append(NotificationItem(
            id=f"status-{d['_id']}",
            type="status_change",
            title=f"Report {st.replace('_', ' ').title()}",
            message=(
                f"Report for {d.get('damage_type', 'damage')} on "
                f"segment {d.get('road_segment_id', 'unknown')} is now {st}."
            ),
            report_id=str(d["_id"]),
            created_at=d.get("updated_at", d["created_at"]),
        ))

    items.sort(key=lambda x: x.created_at, reverse=True)
    return items[:30]
