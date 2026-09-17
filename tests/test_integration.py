"""
RoadIQ – Integration Test Suite
Member 4: System Integration, Testing & Demo Stability

Tests the full system workflow end-to-end by hitting the real FastAPI backend
and AI service.  All services must be running before executing this script.

Usage (from repository root):
    pip install httpx pytest
    python tests/test_integration.py
    # OR
    pytest tests/test_integration.py -v

Services expected:
    Backend:    http://localhost:8000
    AI Service: http://localhost:8001

Environment overrides (optional):
    BACKEND_URL=http://localhost:8000
    AI_URL=http://localhost:8001
"""

import os
import sys
import json
import time
import httpx
import pytest

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BACKEND = os.getenv("BACKEND_URL", "http://localhost:8000")
AI_SVC  = os.getenv("AI_URL",      "http://localhost:8001")
TIMEOUT = 30  # seconds

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get(path: str, params: dict = None) -> httpx.Response:
    return httpx.get(f"{BACKEND}{path}", params=params, timeout=TIMEOUT)


def _post(path: str, json_body: dict = None, files=None, data=None) -> httpx.Response:
    if files is not None:
        return httpx.post(f"{BACKEND}{path}", files=files, data=data, timeout=TIMEOUT)
    return httpx.post(f"{BACKEND}{path}", json=json_body, timeout=TIMEOUT)


def _put(path: str, json_body: dict) -> httpx.Response:
    return httpx.put(f"{BACKEND}{path}", json=json_body, timeout=TIMEOUT)


def _ai_get(path: str) -> httpx.Response:
    return httpx.get(f"{AI_SVC}{path}", timeout=TIMEOUT)


def _ai_post(path: str, files=None, json_body=None, data=None) -> httpx.Response:
    if files is not None:
        return httpx.post(f"{AI_SVC}{path}", files=files, data=data, timeout=TIMEOUT)
    return httpx.post(f"{AI_SVC}{path}", json=json_body, timeout=TIMEOUT)


# ---------------------------------------------------------------------------
# Minimal 1×1 JPEG image bytes for upload tests
# ---------------------------------------------------------------------------

_MINIMAL_JPEG = bytes([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
    0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
    0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD2, 0x8A, 0x28, 0x03, 0xFF, 0xD9,
])


# ===========================================================================
# PRE-FLIGHT
# ===========================================================================

class TestPreflight:
    """Verify all services are reachable before running integration tests."""

    def test_backend_health(self):
        r = _get("/health")
        assert r.status_code == 200, f"Backend health failed: {r.status_code}"
        body = r.json()
        assert body["status"] == "ok"
        print(f"  ✅ Backend healthy: {body}")

    def test_ai_service_health(self):
        try:
            r = _ai_get("/health")
            assert r.status_code == 200, f"AI service health failed: {r.status_code}"
            body = r.json()
            assert body["status"] == "ok"
            print(f"  ✅ AI service healthy: {body}")
        except httpx.ConnectError:
            pytest.skip("AI service not running — backend will use dev-mock fallback (expected)")

    def test_backend_root(self):
        r = _get("/")
        assert r.status_code == 200
        assert "docs" in r.json()


# ===========================================================================
# TEST 1 — AI Detection
# ===========================================================================

class TestAIDetection:
    """TEST 1: Upload image → AI detection returned."""

    def test_analyze_via_backend_proxy(self):
        """POST /api/reports/analyze — backend forwards to AI service."""
        files = {"image": ("road.jpg", _MINIMAL_JPEG, "image/jpeg")}
        data  = {"latitude": "11.0839", "longitude": "77.1421"}
        r = _post("/api/reports/analyze", files=files, data=data)

        # 200 whether real AI or dev-mock
        assert r.status_code == 200, f"Analyze failed [{r.status_code}]: {r.text}"
        body = r.json()

        assert "damage_detected" in body, "Response must have damage_detected"
        assert "detections" in body,      "Response must have detections list"
        assert isinstance(body["detections"], list)

        print(f"  ✅ /api/reports/analyze → damage_detected={body['damage_detected']}, "
              f"{len(body['detections'])} detection(s)")
        return body

    def test_analyze_invalid_file_type(self):
        """Uploading a non-image should return 422."""
        files = {"image": ("test.txt", b"not an image", "text/plain")}
        r = _post("/api/reports/analyze", files=files)
        assert r.status_code == 422, f"Expected 422 for invalid file, got {r.status_code}"
        print("  ✅ Invalid file type → 422 Unprocessable Entity")

    def test_analyze_empty_image(self):
        """Uploading an empty file should return 422."""
        files = {"image": ("empty.jpg", b"", "image/jpeg")}
        r = _post("/api/reports/analyze", files=files)
        assert r.status_code == 422, f"Expected 422 for empty file, got {r.status_code}"
        print("  ✅ Empty image → 422 Unprocessable Entity")

    def test_ai_service_direct_detect(self):
        """POST /detect directly on AI service."""
        try:
            files = {"image": ("road.jpg", _MINIMAL_JPEG, "image/jpeg")}
            data  = {"latitude": "11.0839", "longitude": "77.1421"}
            r = _ai_post("/detect", files=files, data=data)
            assert r.status_code == 200
            body = r.json()
            assert "damage_detected" in body
            assert "detections" in body
            assert "source" in body
            print(f"  ✅ AI /detect → source={body['source']}, "
                  f"detections={len(body['detections'])}")
        except httpx.ConnectError:
            pytest.skip("AI service not running")


# ===========================================================================
# TEST 2 — Report Created in MongoDB
# ===========================================================================

_CREATED_REPORT_ID: str = ""   # shared between tests


class TestReportCRUD:
    """TEST 2: Detection converted to report → MongoDB document created."""

    def test_create_report(self):
        global _CREATED_REPORT_ID
        payload = {
            "damage_type":     "pothole",
            "confidence":      0.87,
            "severity":        "HIGH",
            "latitude":        11.083912,
            "longitude":       77.142156,
            "image_url":       "https://example.com/test.jpg",
            "road_segment_id": "SEG-001",
        }
        r = _post("/api/reports", json_body=payload)
        assert r.status_code == 201, f"Create report failed [{r.status_code}]: {r.text}"

        body = r.json()
        _CREATED_REPORT_ID = body["id"]

        # Validate required fields
        assert body["damage_type"]    == "pothole"
        assert body["severity"]       == "HIGH"
        assert body["status"]         == "PENDING"
        assert body["priority_score"] >= 0
        assert body["priority_score"] <= 100
        assert "created_at" in body
        assert "id"         in body

        print(f"  ✅ Report created: id={body['id']}, priority={body['priority_score']}")

    def test_list_reports(self):
        r = _get("/api/reports")
        assert r.status_code == 200
        body = r.json()
        assert "total"   in body
        assert "reports" in body
        assert body["total"] > 0, "Database should have at least one report"
        print(f"  ✅ GET /api/reports → total={body['total']}")

    def test_list_reports_with_filters(self):
        r = _get("/api/reports", params={"severity": "HIGH", "limit": 5})
        assert r.status_code == 200
        body = r.json()
        for rep in body["reports"]:
            assert rep["severity"] == "HIGH"
        print(f"  ✅ Filter by severity=HIGH → {len(body['reports'])} reports")

    def test_get_report_by_id(self):
        if not _CREATED_REPORT_ID:
            pytest.skip("No report ID from create test")
        r = _get(f"/api/reports/{_CREATED_REPORT_ID}")
        assert r.status_code == 200
        body = r.json()
        assert body["id"] == _CREATED_REPORT_ID
        print(f"  ✅ GET /api/reports/{_CREATED_REPORT_ID} → ok")

    def test_get_report_invalid_id(self):
        r = _get("/api/reports/not-a-valid-id")
        assert r.status_code == 422, f"Expected 422 for invalid ID, got {r.status_code}"
        print("  ✅ Invalid report ID → 422")

    def test_get_report_not_found(self):
        r = _get("/api/reports/000000000000000000000000")
        assert r.status_code == 404
        print("  ✅ Non-existent report → 404")

    def test_create_report_invalid_gps(self):
        payload = {
            "damage_type": "pothole",
            "confidence":  0.87,
            "severity":    "HIGH",
            "latitude":    999.0,   # invalid
            "longitude":   999.0,   # invalid
        }
        r = _post("/api/reports", json_body=payload)
        assert r.status_code == 422, f"Expected 422 for invalid GPS, got {r.status_code}"
        print("  ✅ Invalid GPS → 422")

    def test_create_report_invalid_status(self):
        """PUT with invalid status should return 422."""
        if not _CREATED_REPORT_ID:
            pytest.skip("No report ID")
        r = _put(f"/api/reports/{_CREATED_REPORT_ID}/status", {"status": "FLYING"})
        assert r.status_code == 422
        print("  ✅ Invalid status → 422")


# ===========================================================================
# TEST 3 — Dashboard
# ===========================================================================

class TestDashboard:
    """TEST 3: Dashboard opens → report appears in stats."""

    def test_dashboard_stats(self):
        r = _get("/api/dashboard/stats")
        assert r.status_code == 200, f"Dashboard stats failed: {r.text}"
        body = r.json()

        required_keys = {
            "total_reports", "critical_damages", "high_priority",
            "pending_repairs", "average_road_health", "resolved_today",
        }
        missing = required_keys - set(body.keys())
        assert not missing, f"Missing dashboard keys: {missing}"

        assert body["total_reports"] > 0, "Dashboard should show > 0 reports after seeding"
        assert 0 <= body["average_road_health"] <= 100

        print(f"  ✅ Dashboard stats → total={body['total_reports']}, "
              f"health={body['average_road_health']}")


# ===========================================================================
# TEST 4 — Map / Road Segments
# ===========================================================================

class TestMapAndRoads:
    """TEST 4: Map data → GPS markers can be displayed."""

    def test_list_road_segments(self):
        r = _get("/api/roads")
        assert r.status_code == 200
        body = r.json()
        assert "segments" in body
        assert "total"    in body

        for seg in body["segments"]:
            assert "segment_id"   in seg
            assert "health_score" in seg
            assert "latitude"     in seg
            assert "longitude"    in seg
            assert 0 <= seg["health_score"] <= 100

        print(f"  ✅ /api/roads → {body['total']} segments with health scores")

    def test_get_road_segment(self):
        r = _get("/api/roads/SEG-001")
        assert r.status_code == 200
        body = r.json()
        assert body["segment_id"] == "SEG-001"
        print(f"  ✅ /api/roads/SEG-001 → health={body['health_score']}")

    def test_reports_have_gps(self):
        r = _get("/api/reports")
        body = r.json()
        for rep in body["reports"][:5]:
            assert -90  <= rep["latitude"]  <= 90
            assert -180 <= rep["longitude"] <= 180
        print("  ✅ Reports contain valid GPS coordinates")


# ===========================================================================
# TEST 5 — Priority Queue
# ===========================================================================

class TestPriority:
    """TEST 5: Priority queue → scores displayed."""

    def test_priority_queue(self):
        r = _get("/api/priority")
        assert r.status_code == 200, f"Priority endpoint failed: {r.text}"
        body = r.json()
        assert "items" in body
        assert "total" in body

        for item in body["items"]:
            assert "segment_id"     in item
            assert "priority_score" in item
            assert 0 <= item["priority_score"] <= 100
            assert "reason"         in item

        # Verify sorted highest-first
        scores = [item["priority_score"] for item in body["items"]]
        assert scores == sorted(scores, reverse=True), "Priority items not sorted high→low"

        print(f"  ✅ /api/priority → {body['total']} items, "
              f"top score={scores[0] if scores else 'N/A'}")


# ===========================================================================
# TEST 6 — Status Progression
# ===========================================================================

class TestStatusProgression:
    """TEST 6: PENDING → ASSIGNED → UNDER_REPAIR → RESOLVED lifecycle."""

    def test_status_progression(self):
        # Create a fresh report
        payload = {
            "damage_type": "alligator_crack",
            "confidence":  0.91,
            "severity":    "CRITICAL",
            "latitude":    13.0827,
            "longitude":   80.2707,
            "road_segment_id": "SEG-001",
        }
        r = _post("/api/reports", json_body=payload)
        assert r.status_code == 201
        report_id = r.json()["id"]

        lifecycle = ["ASSIGNED", "UNDER_REPAIR", "RESOLVED"]
        for new_status in lifecycle:
            r = _put(f"/api/reports/{report_id}/status", {"status": new_status})
            assert r.status_code == 200, \
                f"Status update to {new_status} failed [{r.status_code}]: {r.text}"
            body = r.json()
            assert body["status"] == new_status, \
                f"Expected status={new_status}, got {body['status']}"
            print(f"  ✅ {report_id} → {new_status}")

        # Verify repair record created
        repairs_r = _get("/api/repairs")
        assert repairs_r.status_code == 200
        repair_ids = [rep["report_id"] for rep in repairs_r.json()]
        assert report_id in repair_ids, "Repair record not found after status progression"
        print(f"  ✅ Repair record exists for {report_id}")


# ===========================================================================
# TEST 7 — Before/After Verification
# ===========================================================================

class TestVerification:
    """TEST 7: Before/after images → AI verification result displayed."""

    def test_verify_repair(self):
        # Create and resolve a report first
        payload = {
            "damage_type": "pothole",
            "confidence":  0.88,
            "severity":    "HIGH",
            "latitude":    13.0067,
            "longitude":   80.2206,
        }
        r = _post("/api/reports", json_body=payload)
        assert r.status_code == 201
        report_id = r.json()["id"]

        # Verify it
        verify_payload = {
            "report_id":        report_id,
            "before_image_url": "https://placehold.co/640x480?text=before",
            "after_image_url":  "https://placehold.co/640x480?text=after",
        }
        r = _post("/api/verify-repair", json_body=verify_payload)
        assert r.status_code == 200, f"Verify-repair failed [{r.status_code}]: {r.text}"
        body = r.json()

        required = {"report_id", "verified", "confidence", "damage_detected_after", "notes", "verified_at"}
        missing  = required - set(body.keys())
        assert not missing, f"Missing verification keys: {missing}"

        assert isinstance(body["verified"],              bool)
        assert isinstance(body["damage_detected_after"], bool)
        assert isinstance(body["confidence"],            float)
        assert body["report_id"] == report_id

        print(f"  ✅ Verification → verified={body['verified']}, "
              f"confidence={body['confidence']}, notes={body['notes'][:60]}…")

    def test_verifications_list(self):
        r = _get("/api/verifications")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        print(f"  ✅ /api/verifications → {len(r.json())} records")

    def test_verify_invalid_report_id(self):
        payload = {
            "report_id":        "000000000000000000000000",
            "before_image_url": "https://example.com/before.jpg",
            "after_image_url":  "https://example.com/after.jpg",
        }
        r = _post("/api/verify-repair", json_body=payload)
        assert r.status_code == 404
        print("  ✅ Verify with non-existent report_id → 404")


# ===========================================================================
# ERROR HANDLING
# ===========================================================================

class TestErrorHandling:
    """Validate that all error cases return appropriate HTTP codes and messages."""

    def test_analytics_endpoint(self):
        r = _get("/api/analytics")
        assert r.status_code == 200
        body = r.json()
        assert "total_reports"  in body
        assert "daily_reports"  in body
        print(f"  ✅ /api/analytics → total={body['total_reports']}")

    def test_notifications_endpoint(self):
        r = _get("/api/notifications")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        print(f"  ✅ /api/notifications → {len(r.json())} notifications")

    def test_repairs_endpoint(self):
        r = _get("/api/repairs")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        print(f"  ✅ /api/repairs → {len(r.json())} repairs")

    def test_recurring_damage_endpoint(self):
        r = _get("/api/recurring-damage")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        print(f"  ✅ /api/recurring-damage → {len(r.json())} segments")

    def test_road_segment_not_found(self):
        r = _get("/api/roads/SEG-NONEXISTENT")
        assert r.status_code == 404
        print("  ✅ Non-existent segment → 404")

    def test_repair_not_found(self):
        r = _get("/api/repairs/000000000000000000000000")
        assert r.status_code == 404
        print("  ✅ Non-existent repair → 404")


# ===========================================================================
# Runner
# ===========================================================================

def run_all():
    """Simple sequential runner with summary output (no pytest required)."""
    classes = [
        TestPreflight,
        TestAIDetection,
        TestReportCRUD,
        TestDashboard,
        TestMapAndRoads,
        TestPriority,
        TestStatusProgression,
        TestVerification,
        TestErrorHandling,
    ]

    passed = 0
    failed = 0
    skipped = 0

    for cls in classes:
        print(f"\n{'='*60}")
        print(f"  {cls.__name__}: {cls.__doc__}")
        print("="*60)
        instance = cls()

        for method_name in dir(instance):
            if not method_name.startswith("test_"):
                continue
            method = getattr(instance, method_name)
            try:
                method()
                passed += 1
            except pytest.skip.Exception as e:
                print(f"  ⚠  SKIPPED: {method_name} — {e}")
                skipped += 1
            except AssertionError as e:
                print(f"  ❌ FAILED:  {method_name}")
                print(f"     {e}")
                failed += 1
            except Exception as e:
                print(f"  ❌ ERROR:   {method_name}")
                print(f"     {type(e).__name__}: {e}")
                failed += 1

    print(f"\n{'='*60}")
    print(f"  RESULTS: {passed} passed | {failed} failed | {skipped} skipped")
    print("="*60)
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    print("RoadIQ Integration Test Suite")
    print(f"  Backend:    {BACKEND}")
    print(f"  AI Service: {AI_SVC}")
    print()
    run_all()
