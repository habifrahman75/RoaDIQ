"""
RoadIQ Backend – app/routes/repairs.py

GET  /api/repairs           – List all repair records
GET  /api/repairs/{id}      – Single repair record
POST /api/repairs           – Create a repair assignment
PUT  /api/repairs/{id}      – Update repair record (assigned_to, notes, etc.)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
from typing import List
import logging

from app.database.mongodb import get_db
from app.schemas.repair import RepairCreate, RepairResponse
from app.schemas.report import ReportStatus

router = APIRouter(prefix="/api/repairs", tags=["Repairs"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _valid_oid(rid: str) -> ObjectId:
    try:
        return ObjectId(rid)
    except InvalidId:
        raise HTTPException(status_code=422, detail=f"Invalid ID: '{rid}'")


def _to_response(doc: dict) -> RepairResponse:
    return RepairResponse(
        id=str(doc["_id"]),
        report_id=doc["report_id"],
        assigned_to=doc.get("assigned_to"),
        status=doc["status"],
        assigned_at=doc["assigned_at"],
        resolved_at=doc.get("resolved_at"),
        notes=doc.get("notes"),
    )


# ---------------------------------------------------------------------------
# POST /api/repairs
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=RepairResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a repair assignment for a report",
)
async def create_repair(
    payload: RepairCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Verify the report exists
    try:
        oid = ObjectId(payload.report_id)
    except InvalidId:
        raise HTTPException(status_code=422, detail="Invalid report_id format.")

    report = await db["reports"].find_one({"_id": oid})
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{payload.report_id}' not found.",
        )

    now = datetime.now(timezone.utc)
    doc = {
        "report_id":   payload.report_id,
        "assigned_to": payload.assigned_to,
        "status":      ReportStatus.ASSIGNED.value,
        "assigned_at": now,
        "resolved_at": None,
        "notes":       payload.notes,
        "updated_at":  now,
    }
    result = await db["repairs"].insert_one(doc)
    doc["_id"] = result.inserted_id

    # Mirror status back to the report
    await db["reports"].update_one(
        {"_id": oid},
        {"$set": {"status": ReportStatus.ASSIGNED.value, "updated_at": now}},
    )

    logger.info("Repair assigned for report: %s", payload.report_id)
    return _to_response(doc)


# ---------------------------------------------------------------------------
# GET /api/repairs
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[RepairResponse],
    summary="List all repair records",
)
async def list_repairs(
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs = await db["repairs"].find({}).sort("assigned_at", -1).to_list(length=None)
    return [_to_response(d) for d in docs]


# ---------------------------------------------------------------------------
# GET /api/repairs/{repair_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{repair_id}",
    response_model=RepairResponse,
    summary="Get a single repair record",
)
async def get_repair(
    repair_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    oid = _valid_oid(repair_id)
    doc = await db["repairs"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repair record '{repair_id}' not found.",
        )
    return _to_response(doc)


# ---------------------------------------------------------------------------
# PUT /api/repairs/{repair_id}
# ---------------------------------------------------------------------------

class RepairUpdate(RepairCreate):
    status: ReportStatus | None = None  # type: ignore[assignment]


@router.put(
    "/{repair_id}",
    response_model=RepairResponse,
    summary="Update a repair record",
)
async def update_repair(
    repair_id: str,
    payload:   RepairUpdate,
    db:        AsyncIOMotorDatabase = Depends(get_db),
):
    oid = _valid_oid(repair_id)
    now = datetime.now(timezone.utc)

    update: dict = {"updated_at": now}
    if payload.assigned_to is not None:
        update["assigned_to"] = payload.assigned_to
    if payload.notes is not None:
        update["notes"] = payload.notes
    if payload.status is not None:
        update["status"] = payload.status.value
        if payload.status == ReportStatus.RESOLVED:
            update["resolved_at"] = now

    result = await db["repairs"].update_one({"_id": oid}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repair record '{repair_id}' not found.",
        )

    doc = await db["repairs"].find_one({"_id": oid})
    return _to_response(doc)
