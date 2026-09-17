# RoadIQ — AI-Powered Road Health & Maintenance Intelligence Platform

> **Hackathon MVP** | Member 4 — System Integration, Testing & Demo Stability

RoadIQ detects road damage from images/video using YOLO + OpenCV, captures GPS location, stores reports in MongoDB, calculates road health and repair priority, and displays everything on an interactive authority dashboard.

---

## System Architecture

```
Browser (React + Vite)          :5173
          │  VITE_API_BASE_URL
          ▼
FastAPI Backend                 :8000
          │  AI_SERVICE_URL
          │  MONGODB_URI
     ┌────┴────┐
     ▼         ▼
AI Service    MongoDB           :8001  |  :27017
(YOLO/mock)
```

---

## Quick Start (3 terminals)

### Prerequisites

| Tool    | Min Version | Check                 |
|---------|-------------|-----------------------|
| Python  | 3.10        | `python --version`    |
| Node.js | 18          | `node --version`      |
| npm     | 9           | `npm --version`       |
| MongoDB | 6           | `mongod --version`    |
| Git     | any         | `git --version`       |

---

### Terminal 1 — MongoDB

```bash
# Local installation
mongod --dbpath /data/db

# Or use MongoDB Atlas — paste your connection string into Backend/.env
```

---

### Terminal 2 — Backend (FastAPI, port 8000)

```bash
cd RoaDIQ/Backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env         # Windows
# cp .env.example .env         # Mac/Linux
# Edit .env → set MONGODB_URI if using Atlas

# Seed the database (first run only)
python seed_db.py

# Start the backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Verify: http://localhost:8000/health  
✅ API docs: http://localhost:8000/docs

---

### Terminal 3 — AI Service (FastAPI, port 8001)

```bash
cd ai

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env         # Windows
# cp .env.example .env         # Mac/Linux
# Default: AI_MOCK_MODE=true (no GPU / model file required)

# Start the AI service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

✅ Verify: http://localhost:8001/health

---

### Terminal 4 — Frontend (React + Vite, port 5173)

```bash
cd RoaDIQ/frontend

# Install dependencies
npm install

# Ensure real-backend mode is active
# frontend/.env should contain:
#   VITE_API_BASE_URL=http://localhost:8000
#   VITE_USE_MOCK=false

# Start dev server
npm run dev
```

✅ Open: http://localhost:5173

---

## Demo Login Credentials

| Role        | Email                  | Password  |
|-------------|------------------------|-----------|
| Authority   | `admin@roadiq.gov`     | `admin123` |
| Contributor | any                    | any        |

---

## Environment Variables

### Backend (`RoaDIQ/Backend/.env`)

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=roadiq
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
AI_SERVICE_URL=http://localhost:8001
APP_ENV=development
APP_PORT=8000
```

### AI Service (`ai/.env`)

```env
AI_MOCK_MODE=true
AI_MODEL_PATH=models/roadiq_yolo.pt
AI_CONF_THRESHOLD=0.35
AI_PORT=8001
AI_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000
```

### Frontend (`RoaDIQ/frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=false
```

---

## Using a Real YOLO Model

1. Copy your trained `.pt` file to `ai/models/`
2. In `ai/requirements.txt`, uncomment `ultralytics==8.2.0` and re-run `pip install -r requirements.txt`
3. In `ai/.env`, set:
   ```env
   AI_MOCK_MODE=false
   AI_MODEL_PATH=models/<your_model>.pt
   ```
4. Restart the AI service

The class map in [`ai/config.py`](ai/config.py) (`CLASS_MAP`) must match your model's class indices.

---

## Repository Structure

```
RoadIQ/
├── RoaDIQ/
│   ├── Backend/              ← Member 2 (FastAPI + MongoDB)
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── routes/       ← dashboard, reports, roads, priority,
│   │   │   │                    repairs, verification, analytics,
│   │   │   │                    notifications, contributors, recurring
│   │   │   ├── services/     ← priority_service, road_health_service
│   │   │   ├── schemas/      ← report, repair, road
│   │   │   └── database/     ← mongodb.py
│   │   ├── requirements.txt
│   │   ├── seed_db.py
│   │   └── .env.example
│   └── frontend/             ← Member 1 (React + Vite + Tailwind)
│       ├── src/
│       │   ├── services/api.js     ← all API calls (mock/real toggle)
│       │   ├── pages/
│       │   │   ├── authority/      ← Dashboard, Map, Reports, Priority,
│       │   │   │                      Repairs, Verification, Analytics …
│       │   │   └── contributor/    ← Dashboard, ReportForm, MyReports …
│       │   ├── components/
│       │   ├── context/            ← AuthContext
│       │   ├── hooks/
│       │   ├── mock/data.js        ← offline mock data
│       │   └── utils/
│       └── .env.example
├── ai/                       ← Member 3 (YOLO AI microservice)
│   ├── main.py               ← FastAPI app (port 8001)
│   ├── detector.py           ← YOLO inference + mock fallback
│   ├── severity.py           ← bbox-based severity estimation
│   ├── verification.py       ← before/after comparison
│   ├── config.py
│   ├── requirements.txt
│   └── models/               ← drop .pt weights here
├── docs/                     ← Member 4 (Integration docs)
│   ├── API_CONTRACT.md
│   ├── INTEGRATION_GUIDE.md
│   ├── TESTING_CHECKLIST.md
│   └── DEMO_FLOW.md
├── tests/                    ← Member 4 (Integration tests)
│   └── test_integration.py
├── .gitignore
└── README.md                 ← This file
```

---

## Integration Tests

Run automated integration tests (requires all services running):

```bash
# From repository root
pip install httpx pytest

# Full integration test suite
python tests/test_integration.py

# Or with pytest
pytest tests/test_integration.py -v
```

See [`docs/TESTING_CHECKLIST.md`](docs/TESTING_CHECKLIST.md) for the manual test checklist.

---

## Key API Endpoints

| Method | Endpoint                      | Description                      |
|--------|-------------------------------|----------------------------------|
| GET    | `/health`                     | Backend health check             |
| GET    | `/api/dashboard/stats`        | KPI summary for dashboard        |
| GET    | `/api/reports`                | List reports (filterable)        |
| POST   | `/api/reports`                | Submit a damage report           |
| POST   | `/api/reports/analyze`        | Upload image → AI detection      |
| GET    | `/api/reports/{id}`           | Single report detail             |
| PUT    | `/api/reports/{id}/status`    | Update repair status             |
| GET    | `/api/roads`                  | List road segments               |
| GET    | `/api/priority`               | Priority queue                   |
| GET    | `/api/repairs`                | List repair records              |
| POST   | `/api/verify-repair`          | Before/after AI verification     |
| GET    | `/api/analytics`              | Analytics data                   |

Full contract: [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)

---

## Damage Types & Severity

**Damage Types:** `pothole` | `longitudinal_crack` | `transverse_crack` | `alligator_crack` | `damaged_road`

**Severity:** `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`

**Repair Status:** `PENDING` → `ASSIGNED` → `UNDER_REPAIR` → `RESOLVED` / `VERIFICATION_REQUIRED`

**Road Health Score:** 0–100 (80+ = GOOD, 60–79 = MODERATE, 40–59 = POOR, 0–39 = CRITICAL)

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `CORS error` in browser | Add frontend origin to `ALLOWED_ORIGINS` in `Backend/.env` |
| Frontend shows no data | Check `VITE_USE_MOCK=false` and backend is running |
| AI service `Connection refused` | Backend auto-falls back to dev-mock — expected in dev |
| `MONGODB_URI missing` | Copy `.env.example` → `.env` in `Backend/` |
| Map blank / tiles missing | Hard-reload; Leaflet cold-starts slowly |

---

## Team

| Member | Responsibility |
|--------|---------------|
| 1 | Frontend — React + Vite + Tailwind + Leaflet |
| 2 | Backend — FastAPI + MongoDB |
| 3 | AI — YOLO + OpenCV + Severity |
| 4 | Integration + Testing + Git + Demo Stability |
