"""
RoadIQ Backend – app/routes/dashboard.py

GET /api/dashboard/stats – Aggregated KPIs for the authority dashboard
"""

import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.database.mongodb import get_db
from app.services.road_health_service import aggregate_network_health

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)


class DashboardStats(BaseModel):
    total_reports:       int
    critical_damages:    int
    high_priority:       int
    pending_repairs:     int
    average_road_health: float
    resolved_today:      int


@router.get("/stats", response_model=DashboardStats, summary="Aggregated KPIs for the authority dashboard")
async def get_dashboard_stats(db: AsyncIOMotorDatabase = Depends(get_db)):
    reports_col  = db["reports"]
    segments_col = db["road_segments"]

    total_reports    = await reports_col.count_documents({})
    critical_damages = await reports_col.count_documents({"severity": "CRITICAL"})
    high_priority    = await reports_col.count_documents({"priority_score": {"$gte": 70}})
    pending_repairs  = await reports_col.count_documents({"status": "PENDING"})

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    resolved_today = await reports_col.count_documents(
        {"status": "RESOLVED", "updated_at": {"$gte": today_start}}
    )

    cursor = segments_col.find({}, {"health_score": 1})
    segs   = await cursor.to_list(length=None)
    scores = [s["health_score"] for s in segs if "health_score" in s]
    avg_health = aggregate_network_health(scores)

    return DashboardStats(
        total_reports=total_reports,
        critical_damages=critical_damages,
        high_priority=high_priority,
        pending_repairs=pending_repairs,
        average_road_health=avg_health,
        resolved_today=resolved_today,
    )
