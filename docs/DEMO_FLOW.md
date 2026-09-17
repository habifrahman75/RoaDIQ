# RoadIQ Demo Flow

> **Hackathon Demo Script**  
> Estimated duration: 8–10 minutes  
> Audience: Judges / technical reviewers

---

## Before You Start

1. Ensure all three services are running:
   - **Backend**: `http://localhost:8000` (terminal 1)
   - **AI Service**: `http://localhost:8001` (terminal 2)
   - **Frontend**: `http://localhost:5173` (terminal 3)
2. Set `VITE_USE_MOCK=false` in `frontend/.env` and restart `npm run dev`
3. Verify database is seeded: `python seed_db.py` (from Backend/)
4. Have a road image ready for upload (pothole or cracked road photo)
5. Have a before + after image URL ready for verification (or use placeholder URLs)

---

## Act 1 — Citizen / Field User Flow (2 min)

### Scene: A field worker spots a damaged road and reports it

**Step 1:** Open http://localhost:5173 in browser

**Step 2:** Click "Login as Contributor" (or enter `admin@roadiq.gov` / `admin123`)

**Step 3:** Navigate to **"Report Damage"**

> _"A field worker uses the RoadIQ mobile-friendly app to report road damage in real time."_

**Step 4:** Upload a road image (drag-and-drop or browse)

> _"The image is sent to our AI detection pipeline powered by YOLO."_

**Step 5:** Wait for AI analysis result to appear

> _"Our AI identifies the damage type — in this case a pothole — with 87% confidence. It estimates severity as HIGH based on the bounding box coverage."_

**Step 6:** Confirm GPS coordinates (auto-captured or entered manually)

**Step 7:** Submit the report

> _"The report is stored in MongoDB with a computed priority score, GPS coordinates, and timestamp."_

---

## Act 2 — Authority Dashboard (3 min)

### Scene: Road authority reviews incoming damage reports

**Step 1:** Click "Switch to Authority" → login

**Step 2:** Navigate to **Dashboard**

> _"The authority dashboard gives a real-time overview: total reports, critical damages, high-priority roads, and average road health across the network."_

Point out the KPI cards:
- Total Reports
- Critical Damages  
- High Priority Roads
- Road Health Score

**Step 3:** Navigate to **Map**

> _"Every report is plotted on an interactive Leaflet map. Authorities can see damage clusters, filter by severity, and click any marker to view report details."_

Click the newly-submitted report marker → show popup.

**Step 4:** Navigate to **Reports**

> _"The full reports table shows all submissions with severity badges, priority scores, and current status. Authorities can filter, search, and drill into any report."_

Click into the newly-submitted report → show **Report Detail** page.

---

## Act 3 — Priority & Repair Management (2 min)

### Scene: Authority acts on the most critical road segments

**Step 1:** Navigate to **Priority Queue**

> _"RoadIQ computes an explainable priority score for every road segment based on severity, report frequency, and damage risk factor — normalised to 0–100. No black box."_

Point to the priority scores and the reason text.

**Step 2:** Return to the report detail

**Step 3:** Change status: PENDING → ASSIGNED

> _"The authority assigns a repair crew with a single click."_

**Step 4:** Change status: ASSIGNED → UNDER_REPAIR → RESOLVED

> _"The status flows through the repair lifecycle. Each change is recorded in MongoDB and reflected across all dashboard views instantly."_

---

## Act 4 — Before / After AI Verification (2 min)

### Scene: After repair, the authority verifies it was done correctly using AI

**Step 1:** Navigate to **Verification**

> _"Once a repair is completed, the authority uploads a before and after image. RoadIQ's AI compares them to verify the road is actually fixed."_

**Step 2:** Select the resolved report

**Step 3:** Enter before-image URL and after-image URL

**Step 4:** Click "Submit for Verification"

**Step 5:** Show the result

> _"The AI returns: verified = true, damage no longer detected. The report is marked RESOLVED and the verification record is stored for audit."_

---

## Closing Statement

> _"RoadIQ closes the full loop: from field detection → AI analysis → authority dashboard → repair tracking → AI-verified resolution. The system is built for reliability, with mock fallbacks so it runs without a GPU for development, and a clear path to deploy the real YOLO model when ready."_

---

## Fallback Scenarios

| If this fails | Say / Do |
|---|---|
| AI service not running | "The backend automatically falls back to a dev-mode mock and flags it clearly — this is by design, not a bug" |
| MongoDB not running | Switch `VITE_USE_MOCK=true` → "The frontend has a full offline mock mode for resilience" |
| Image upload fails | Use the pre-seeded data that already shows detections in the dashboard |
| Map doesn't render | Reload the page; Leaflet tiles load on second render if cold |
| Status update fails | Show the API docs at `/docs` — the endpoint is there and works |

---

## Quick Demo Commands

```bash
# Health check all services
curl http://localhost:8000/health
curl http://localhost:8001/health

# Confirm reports in DB
curl http://localhost:8000/api/reports | python -m json.tool

# Confirm dashboard stats
curl http://localhost:8000/api/dashboard/stats

# Confirm priority queue
curl http://localhost:8000/api/priority
```
