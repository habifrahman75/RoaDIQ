# RoadIQ Testing Checklist

> **Member 4 — Integration Testing**  
> Run through this checklist before every demo. Mark items ✅ when passing, ❌ if failing (then investigate root cause).

---

## Pre-Flight Checks

| # | Check | Command / Action | Expected | Status |
|---|---|---|---|---|
| 1 | MongoDB running | `mongod --version` | Version printed | ☐ |
| 2 | Backend starts | `uvicorn app.main:app --port 8000` | `RoadIQ backend starting …` | ☐ |
| 3 | MongoDB connects | Check backend logs | `✅ MongoDB Atlas connected successfully` | ☐ |
| 4 | AI service starts | `uvicorn main:app --port 8001` | No errors | ☐ |
| 5 | Frontend starts | `npm run dev` | `http://localhost:5173` | ☐ |
| 6 | VITE_USE_MOCK=false | Check `frontend/.env` | `VITE_USE_MOCK=false` | ☐ |
| 7 | No exposed secrets | `git status` | `.env` not staged | ☐ |

---

## TEST 1 — Upload Image → AI Detection

**Steps:**
1. Open http://localhost:5173
2. Login as Contributor
3. Click "Report Damage" → upload any road image
4. Submit form with GPS coordinates

**Expected:**
- Loading spinner appears during analysis
- AI detection result displayed (damage type, confidence, severity)
- No console errors

**API calls verified:**
- `POST /api/reports/analyze` → returns `{ damage_detected, detections }`
- `POST /api/reports` → creates MongoDB document

| Check | Expected | Result |
|---|---|---|
| AI result displayed | damage_type shown | ☐ |
| Confidence shown | 0.0–1.0 value | ☐ |
| Severity shown | LOW/MEDIUM/HIGH/CRITICAL | ☐ |
| GPS coordinates sent | lat/lon in payload | ☐ |

---

## TEST 2 — MongoDB Document Created

**Steps:**
1. After submitting a report (Test 1)
2. Query backend: `curl http://localhost:8000/api/reports`

**Expected:**
- Report appears in response with correct fields
- `status: "PENDING"`, `priority_score` calculated
- `created_at` set to current time

| Check | Expected | Result |
|---|---|---|
| Report in DB | `total` > 0 | ☐ |
| Fields complete | damage_type, confidence, severity, lat, lon | ☐ |
| Priority score | 0–100 float | ☐ |
| Status = PENDING | status field | ☐ |

---

## TEST 3 — Dashboard Shows Report

**Steps:**
1. Login as Authority
2. Navigate to Dashboard

**Expected:**
- `total_reports` incremented
- `critical_damages` updated if severity=CRITICAL
- Charts render without error

| Check | Expected | Result |
|---|---|---|
| Total reports updated | Count matches DB | ☐ |
| Stats cards show data | No "0" everywhere | ☐ |
| No loading spinner stuck | Data rendered | ☐ |

---

## TEST 4 — Map Shows GPS Marker

**Steps:**
1. Navigate to Map page (Authority)
2. Look for marker at submitted GPS coordinates

**Expected:**
- Leaflet map renders
- Marker appears at correct lat/lon
- Click on marker → report summary popup

| Check | Expected | Result |
|---|---|---|
| Map renders | Leaflet tiles load | ☐ |
| Marker visible | Pin at report location | ☐ |
| Popup shows info | damage_type, severity | ☐ |

---

## TEST 5 — Priority Queue Shows Score

**Steps:**
1. Navigate to Priority page (Authority)

**Expected:**
- Road segments listed
- Priority score (0–100) displayed
- Segments sorted highest-first
- Explainer reason text visible

**API:** `GET /api/priority`

| Check | Expected | Result |
|---|---|---|
| Priority list loads | Segments shown | ☐ |
| Score 0–100 | Numeric value | ☐ |
| Sorted correctly | Highest first | ☐ |
| Reason text | Human-readable string | ☐ |

---

## TEST 6 — Status Progression

**Steps:**
1. Navigate to Reports (Authority)
2. Open a PENDING report
3. Change status: PENDING → ASSIGNED → UNDER_REPAIR → RESOLVED

**API:** `PUT /api/reports/{id}/status`

| Check | Expected | Result |
|---|---|---|
| PENDING → ASSIGNED | Status updates in UI | ☐ |
| ASSIGNED → UNDER_REPAIR | Status updates in UI | ☐ |
| UNDER_REPAIR → RESOLVED | Status updates in UI | ☐ |
| DB updated | API returns new status | ☐ |
| Repair record created | `GET /api/repairs` shows entry | ☐ |

---

## TEST 7 — Before/After Verification

**Steps:**
1. Navigate to Verification page (Authority)
2. Select a RESOLVED report
3. Enter before-image URL and after-image URL
4. Submit verification

**API:** `POST /api/verify-repair`

| Check | Expected | Result |
|---|---|---|
| AI result returned | verified=true/false | ☐ |
| Confidence shown | float value | ☐ |
| Notes displayed | Descriptive text | ☐ |
| Report status updated | RESOLVED or VERIFICATION_REQUIRED | ☐ |
| Appears in list | `GET /api/verifications` returns it | ☐ |

---

## Error Handling Tests

| Scenario | How to Test | Expected Behaviour |
|---|---|---|
| Invalid image | Upload a .txt file | `422 Unprocessable Entity` + user-facing error message |
| Missing image | Submit analyze form without file | Field validation error shown |
| Invalid GPS | Enter lat=999, lon=999 | Backend 422 + error displayed in UI |
| MongoDB unavailable | Stop mongod, try any API call | Backend returns 500, UI shows error state |
| AI service unavailable | Stop AI service, submit image | Backend returns DEV_MOCK result, clearly labelled |
| API timeout | Set `VITE_API_BASE_URL` to non-existent host | Axios timeout → UI shows "Connection error" |
| Empty database | Run with fresh DB (no seed) | UI shows empty states, not blank/crashed screens |
| Invalid report ID | `GET /api/reports/not-an-id` | 422 response |
| Invalid status | `PUT /api/reports/{id}/status` body `{"status":"INVALID"}` | 422 response |
| Unauthorised access | No token, request protected endpoint | Frontend redirects to /login |

---

## Final Demo Readiness Checklist

| Item | Status |
|---|---|
| ☐ Backend starts without errors | |
| ☐ MongoDB connects (check logs) | |
| ☐ AI service starts (mock mode OK) | |
| ☐ Frontend starts at localhost:5173 | |
| ☐ VITE_USE_MOCK=false in frontend/.env | |
| ☐ Database seeded (`python seed_db.py`) | |
| ☐ Login works (mock auth) | |
| ☐ Image upload → AI detection works | |
| ☐ Report appears in dashboard | |
| ☐ Map marker visible | |
| ☐ Priority score displayed | |
| ☐ Status change works (PENDING → RESOLVED) | |
| ☐ Before/after verification works | |
| ☐ No console errors in browser | |
| ☐ No `.env` committed to git | |
| ☐ Mobile layout renders correctly | |
| ☐ README has correct run instructions | |
