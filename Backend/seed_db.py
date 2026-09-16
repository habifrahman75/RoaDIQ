"""
RoadIQ Backend – seed_db.py

Seeds MongoDB with sample road segments and damage reports
so the frontend and dashboard have data to display immediately.

Run from the backend/ directory:
    python seed_db.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
import random

load_dotenv()

MONGODB_URI   = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "roadiq")

# ---------------------------------------------------------------------------
# Sample data
# ---------------------------------------------------------------------------

ROAD_SEGMENTS = [
    {"segment_id": "SEG-001", "name": "Anna Salai – KM 0-2",       "latitude": 13.0827, "longitude": 80.2707},
    {"segment_id": "SEG-002", "name": "Guindy Inner Ring Road",     "latitude": 13.0067, "longitude": 80.2206},
    {"segment_id": "SEG-003", "name": "Mount Road Junction",        "latitude": 13.0604, "longitude": 80.2496},
    {"segment_id": "SEG-004", "name": "Velachery Main Road",        "latitude": 12.9781, "longitude": 80.2209},
    {"segment_id": "SEG-005", "name": "Poonamallee High Road",      "latitude": 13.0453, "longitude": 80.1793},
]

DAMAGE_TYPES = ["pothole", "longitudinal_crack", "transverse_crack", "alligator_crack", "damaged_road"]
SEVERITIES   = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
STATUSES     = ["PENDING", "ASSIGNED", "UNDER_REPAIR", "RESOLVED", "VERIFICATION_REQUIRED"]

SEVERITY_PENALTY = {"CRITICAL": 30.0, "HIGH": 20.0, "MEDIUM": 10.0, "LOW": 5.0}
SEVERITY_WEIGHT  = {"CRITICAL": 1.0, "HIGH": 0.75, "MEDIUM": 0.50, "LOW": 0.25}
DAMAGE_RISK      = {
    "pothole": 1.0, "alligator_crack": 0.9, "damaged_road": 0.85,
    "transverse_crack": 0.6, "longitudinal_crack": 0.5,
}


def calc_priority(severity, damage_type, count, confidence):
    s = SEVERITY_WEIGHT.get(severity, 0.25)
    f = min(count, 20) / 20
    r = DAMAGE_RISK.get(damage_type, 0.5)
    raw = (s * 0.5 + f * 0.3 + r * 0.2) * confidence
    return round(min(raw * 100, 100.0), 1)


async def seed():
    client = AsyncIOMotorClient(MONGODB_URI)
    db     = client[DATABASE_NAME]

    # Clear existing seed data
    await db["road_segments"].delete_many({})
    await db["reports"].delete_many({})
    await db["repairs"].delete_many({})
    print("Cleared existing data.")

    now = datetime.now(timezone.utc)

    # Insert road segments
    for seg in ROAD_SEGMENTS:
        seg["damage_count"]   = 0
        seg["recent_reports"] = []
        seg["health_score"]   = 100.0
        seg["location"]       = {"type": "Point", "coordinates": [seg["longitude"], seg["latitude"]]}
        seg["created_at"]     = now
        seg["updated_at"]     = now

    await db["road_segments"].insert_many(ROAD_SEGMENTS)
    print(f"Inserted {len(ROAD_SEGMENTS)} road segments.")

    # Insert sample reports
    reports = []
    for i in range(30):
        seg       = random.choice(ROAD_SEGMENTS)
        dtype     = random.choice(DAMAGE_TYPES)
        severity  = random.choice(SEVERITIES)
        conf      = round(random.uniform(0.55, 0.99), 2)
        stat      = random.choice(STATUSES)
        created   = now - timedelta(hours=random.randint(1, 720))

        # Add small random offset to coordinates
        lat = seg["latitude"]  + random.uniform(-0.01, 0.01)
        lon = seg["longitude"] + random.uniform(-0.01, 0.01)

        priority = calc_priority(severity, dtype, i % 10 + 1, conf)

        reports.append({
            "damage_type":     dtype,
            "confidence":      conf,
            "severity":        severity,
            "latitude":        round(lat, 6),
            "longitude":       round(lon, 6),
            "image_url":       f"https://placehold.co/640x480?text={dtype}",
            "road_segment_id": seg["segment_id"],
            "priority_score":  priority,
            "priority_reason": "Seeded sample data.",
            "status":          stat,
            "location":        {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
            "created_at":      created,
            "updated_at":      created,
        })

    result = await db["reports"].insert_many(reports)
    print(f"Inserted {len(result.inserted_ids)} sample reports.")

    # Update road segment damage counts
    for seg in ROAD_SEGMENTS:
        count = await db["reports"].count_documents({"road_segment_id": seg["segment_id"]})
        recent = await db["reports"].find(
            {"road_segment_id": seg["segment_id"]}
        ).sort("created_at", -1).limit(5).to_list(5)
        recent_ids = [str(r["_id"]) for r in recent]

        # Compute simple health score
        active = await db["reports"].find(
            {"road_segment_id": seg["segment_id"], "status": {"$ne": "RESOLVED"}}
        ).to_list(None)
        penalty = sum(SEVERITY_PENALTY.get(r["severity"], 5.0) * r["confidence"] for r in active)
        health = round(max(0.0, 100.0 - penalty), 1)

        await db["road_segments"].update_one(
            {"segment_id": seg["segment_id"]},
            {"$set": {"damage_count": count, "recent_reports": recent_ids, "health_score": health}},
        )

    print("Updated road segment health scores.")
    client.close()
    print("✅ Seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed())
